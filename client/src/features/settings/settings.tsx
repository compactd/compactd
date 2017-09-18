import * as Defs from 'definitions';
import { SettingsAction } from './actions.d';
import {Artist, Album, Tracker, trackerURI, mapTrackerToParams} from 'compactd-models';
import {getDatabase} from 'app/database';
import Toaster from 'app/toaster';

const initialState: Defs.SettingsState = {
  opened: false
};

const TOGGLE_SETTINGS_PAGE = 'cassette/settings/TOGGLE_SETTINGS_PAGE';
const RESOLVE_TRACKERS = 'cassette/settings/RESOLVE_TRACKERS';

export function reducer (state: Defs.SettingsState = initialState,
  action: SettingsAction): Defs.SettingsState {
  switch (action.type) {
    case TOGGLE_SETTINGS_PAGE:
      return Object.assign({}, state, {
        opened: !state.opened
      });
    case RESOLVE_TRACKERS:
      return Object.assign({}, state, {
        trackers: action.trackers
      });
  }
  return state;
}

function toggleSettingsPage (state?: boolean) {
  return {type: TOGGLE_SETTINGS_PAGE};
}
function loadTrackers () {
  return async function (dispatch: (action: SettingsAction) => void, getState: () => Defs.CompactdState) {
    try {
      const Tracker = getDatabase<Tracker>('trackers');
      const trackers = await Tracker.allDocs({include_docs: true});
      dispatch({
        type: RESOLVE_TRACKERS,
        trackers: trackers.rows.filter((el) => el.key !== '_design/validator').map((el) => el.doc)
      })
    } catch (err) {
      Toaster.error(err);
    }
  }  
}
function editTracker (id: string, props: Partial<Tracker>) {
  return async function (dispatch: (action: SettingsAction) => void, getState: () => Defs.CompactdState) {
    try {
      const Tracker = getDatabase<Tracker>('trackers');
  
      const doc = Object.assign({}, await Tracker.get(id, {revs: false, attachments: false, revs_info: false}), props);
      await Tracker.put({
        _id: doc._id,
        _rev: doc._rev,
        type: doc.type,
        name: doc.name,
        host: doc.host,
        username: doc.username,
        boost: doc.boost,
        ...props
      });
  
      return loadTrackers()(dispatch, getState);
    } catch (err) {
      Toaster.error(err);
    }
  }  

}

function editTrackerPassword (id: string, password: string ) {
  return async function (dispatch: (action: SettingsAction) => void, getState: () => Defs.CompactdState) {
    try {
      const {type, username} = trackerURI(id);
      const res = await fetch(`/api/cascade/trackers/${type}/${username}/password`, {
        method: 'post',
        body: {password},
        headers: {
          'Authorization': 'Bearer ' + window.sessionStorage.getItem('session_token')
        }
      });
      const data: any = res.json();
  
      if (data.ok) {
        return loadTrackers()(dispatch, getState);
      }
    } catch (err) {
      Toaster.error(err);
    }
  }
}

function addTracker (name: string, type: 'gazelle', username: string, host: string = 'redacted.ch') {
  return async function (dispatch: (action: SettingsAction) => void, getState: () => Defs.CompactdState) {
    try {
      const props = {name, type, username, host};
      const id = trackerURI(mapTrackerToParams(props)) + `-${Math.floor(Math.random() * 2e8).toString(36)}`;
  
      const Tracker = getDatabase<Tracker>('trackers');
      const tracker = await Tracker.put({...props, _id: id});
      return loadTrackers()(dispatch, getState);
    } catch (err) {
      Toaster.error(err);
    }
  }
}

export const actions = {
  toggleSettingsPage, loadTrackers, editTracker, editTrackerPassword, addTracker
}