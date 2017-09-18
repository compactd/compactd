import * as Defs from 'definitions';
import { AppAction } from './actions.d';
import * as PouchDB from 'pouchdb';
import * as thunk from 'redux-thunk';
import * as jwt from 'jwt-decode';
import {getDatabase} from 'app/database';
import Toaster from 'app/toaster';

const RESOLVE_STATE = 'compactd/app/RESOLVE_STATE';
const SET_USER = 'compactd/app/SET_USER';
const START_SYNC = 'compactd/app/START_SYNC';
const UPDATE_SYNC = 'compactd/app/UPDATE_SYNC';
const END_SYNC = 'compactd/app/END_SYNC';
const SHOW_ERROR = 'compactd/app/SHOW_ERROR';

const initialState: Defs.AppState = {
  loading: true,
  syncing: false,
  configured: true,
  synced: false
};

export function reducer (state: Defs.AppState = initialState,
  action: AppAction): Defs.AppState {
  switch (action.type) {
    case SET_USER:
      return Object.assign({}, state, {user: action.user});
    case RESOLVE_STATE:
      return Object.assign({}, state, {
        loading: false,
        configured: action.configured,
        user: action.user
      });
    case START_SYNC:
      return Object.assign({}, state, {
        syncing: true,
        syncingProgress: 0
      });
    case UPDATE_SYNC:
      return Object.assign({}, state, {
        syncingProgress: action.progress
      });
    case END_SYNC:
      return Object.assign({}, state, {
        syncingProgress: 1,
        syncing: false,
        synced: true
      });
  }
  return state;
}

function login (username: string, password: string) {
  return fetch('/api/sessions',
    {method: 'POST',
    headers: {'Content-Type': 'application/json'},
    body: JSON.stringify({username, password})})
    .then((res) => res.json()).then((res) => {
    sessionStorage.setItem('session_token',res.token);
    return {type: SET_USER, user: jwt(res.token)};
  }).catch((err) => {
    Toaster.error('Invalid username or password');
  });
}

function fetchState () {
  return new Promise((resolve, reject) => {
    setTimeout(resolve, 400);
  }).then(() => {
    const token = sessionStorage.getItem('session_token');
    try {
      const user = jwt(token || '');
      return {
        type: RESOLVE_STATE,
        configured: true,
        user: user
      }
    } catch (err) {
      Toaster.error(err);
    }
    return {
      type: RESOLVE_STATE,
      configured: true
    }
  });
}

function syncDB (dbs: string[], max: number): thunk.ThunkAction<void, Defs.CompactdState, void>  {
  return (dispatch, getState) => {
    const dbName = dbs[0];
    const db = new PouchDB(dbName);
    const remote = getDatabase(dbName);

    db.sync(remote).on('complete', (info) => {
      dispatch({
        type: UPDATE_SYNC,
        progress: (max - dbs.length + 1) / max
      });
      // db.sync(remote, {live: true}).on('change', (info) => {
      //   console.log(info);
      // }).on('error', (err: any) => {
      //   console.log(err);
      //   Toaster.error(`An error happened during live database sync for ${dbName}: ${err.code}`);
      // }).on('paused', function (info) {
      // });
      if (dbs.length > 1) {
        return (syncDB(dbs.slice(1), max) as any)(dispatch, getState);
      } else {
        setTimeout(() =>
          dispatch({
            type: END_SYNC
          }), 250);
      }
    }).on('error', (err: any) => {
      console.log(err);
      Toaster.error(`An error happened during database sync for ${dbName}: ${err.code}`);
    });
  }
}
function sync (): thunk.ThunkAction<void, Defs.CompactdState, void>  {
  return (dispatch, getState) => {
    if (getState().app.syncing) {
      return;
    }
    const dbs = [ 'artists', 'albums', 'tracks', 'files', 'trackers'];

    (syncDB(dbs, dbs.length) as any)(dispatch, getState);
  }
}

export const actions = {
  sync, fetchState, login
}
