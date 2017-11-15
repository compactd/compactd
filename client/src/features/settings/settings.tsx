import * as Defs from 'definitions';
import { SettingsAction } from './actions.d';
import {Artist, Album, Tracker, trackerURI, mapTrackerToParams, Library} from 'compactd-models';
import {getDatabase} from 'app/database';
import PouchDB from 'pouchdb';
import {Intent} from '@blueprintjs/core';
import Toaster from 'app/toaster';
import Socket from 'app/socket';
import Session from 'app/session';

const initialState: Defs.SettingsState = {
  opened: false,
  scanning: false,
  trackers: [],
  libraries: []
};

const TOGGLE_SETTINGS_PAGE = 'cassette/settings/TOGGLE_SETTINGS_PAGE';
const RESOLVE_TRACKERS = 'cassette/settings/RESOLVE_TRACKERS';
const RESOLVE_LIBRARIES = 'cassette/settings/RESOLVE_LIBRARIES';
const SET_SCANNING = 'cassette/settings/SET_SCANNING';

export function reducer (state: Defs.SettingsState = initialState,
  action: SettingsAction): Defs.SettingsState {
  switch (action.type) {
    case SET_SCANNING:
      return Object.assign({}, state, {
        scanning: action.scanning
      });
    case TOGGLE_SETTINGS_PAGE:
      return Object.assign({}, state, {
        opened: !state.opened
      });
    case RESOLVE_TRACKERS:
      return Object.assign({}, state, {
        trackers: action.trackers
      });
    case RESOLVE_LIBRARIES:
      return Object.assign({}, state, {
        libraries: action.libraries
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

function loadLibraries () {
  return async function (dispatch: (action: SettingsAction) => void, getState: () => Defs.CompactdState) {
    try {
      const Library = getDatabase<Library>('libraries');
      const libraries = await Library.allDocs({include_docs: true});
      dispatch({
        type: RESOLVE_LIBRARIES,
        libraries: libraries.rows.filter((el) => el.key !== '_design/validator').map((el) => el.doc)
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
      
      const {type, name} = trackerURI(id);
      const res = await fetch(`/api/cascade/trackers/${type}/${name}/password`, {
        method: 'post',
        body: JSON.stringify({password}),
        headers: Session.headers({
          'content-type': 'application/json'
        })
      });
      const data: any = await res.json();
      if (!res.ok) return Toaster.error(data.error);
  
      if (data.ok) {
        Toaster.show({icon: 'tick', message: 'Password succesfully updated', intent: 'SUCCESS'});
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

function scan (id: string, full = false) {
  return async (dispatch: any) => {
    dispatch({type: SET_SCANNING, scanning: true});
    const res = await fetch(`/api/scans`, {
      method: 'POST',
      body: JSON.stringify({
        libraryId: id, full
      }),
      headers: Session.headers({
        'content-type': 'application/json',
      })
    });
    if (res.status !== 201) {
      return Toaster.error('An error happened while trying to start scan. Check logs for more details');
    }
    const data = await res.json();
    const {finish, open_folder, error} = data.events;

    const toast = Toaster.show({
      icon: 'search',
      message: 'Scanning your music',
      intent: 'PRIMARY',
      timeout: 999999999
    });
    
    Socket.listen(finish, () => {
      Toaster.update(toast, {message: 'Scan sucessfully finished', intent: Intent.SUCCESS});
      dispatch({type: SET_SCANNING, scanning: false, timeoout: 2000});
    });

    Socket.listen(open_folder, (evt: any) => {
      Toaster.update(toast, {message: `Scanning folder ${evt.folder}`});
    });

    Socket.listen(error, (evt: any) => {
      dispatch({type: SET_SCANNING, scanning: false});
      Toaster.update(toast, {message: 'Scan failed, please check logs for more details', intent: Intent.DANGER});
    });
  }
}

export const actions = {
  toggleSettingsPage, loadTrackers, editTracker, editTrackerPassword, addTracker, loadLibraries, scan
}