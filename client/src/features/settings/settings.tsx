import * as Defs from 'definitions';
import { SettingsAction } from './actions.d';
import {Artist, Album, Tracker, trackerURI, mapTrackerToParams} from 'compactd-models';
import * as PouchDB from 'pouchdb';

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
    const Tracker = new PouchDB<Tracker>('trackers');
    const trackers = await Tracker.allDocs({include_docs: true});
    dispatch({
      type: RESOLVE_TRACKERS,
      trackers: trackers.rows.filter((el) => el.key !== '_design/validator').map((el) => el.doc)
    })
  }  
}
function editTracker (id: string, props: Partial<Tracker>) {
  return async function (dispatch: (action: SettingsAction) => void, getState: () => Defs.CompactdState) {
    const Tracker = new PouchDB<Tracker>('trackers');

    const doc = Object.assign({}, await Tracker.get(id, {revs: false, attachments: false, revs_info: false}), props);
    await Tracker.put(doc as any);

    return loadTrackers()(dispatch, getState);
  }  

}

function editTrackerPassword (id: string, password: string ) {
  return async function (dispatch: (action: SettingsAction) => void, getState: () => Defs.CompactdState) {
    const {type, username} = trackerURI(id);
    console.log(id, password, type, username);
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
  }
}

function addTracker (name: string, type: 'gazelle', username: string, host: string = 'redacted.ch') {
  return async function (dispatch: (action: SettingsAction) => void, getState: () => Defs.CompactdState) {
    const props = {name, type, username, host};
    const id = trackerURI(mapTrackerToParams(props)) + `-${Math.floor(Math.random() * 2e8).toString(36)}`;

    const Tracker = new PouchDB<Tracker>('trackers');
    const tracker = await Tracker.put({...props, _id: id});
    return loadTrackers()(dispatch, getState);
  }
}

export const actions = {
  toggleSettingsPage, loadTrackers, editTracker, editTrackerPassword, addTracker
}