import * as Defs from 'definitions';
import { AppAction } from './actions.d';
import * as PouchDB from 'pouchdb';
import * as thunk from 'redux-thunk';

const RESOLVE_STATE = 'compactd/app/RESOLVE_STATE';
const SET_USER = 'compactd/app/SET_USER';
const START_SYNC = 'compactd/app/START_SYNC';
const UPDATE_SYNC = 'compactd/app/UPDATE_SYNC';
const END_SYNC = 'compactd/app/END_SYNC';

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
        configured: action.configured
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

function fetchState () {
  return new Promise((resolve, reject) => {
    setTimeout(resolve, 400);
  }).then(() => {
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
    const remote = new PouchDB(`${window.location.origin}/database/${dbName}`, {
      auth: {
        username: 'admin',
        password: 'password'
      }
    });
    db.sync(remote).on('complete', (info) => {
      dispatch({
        type: UPDATE_SYNC,
        progress: (max - dbs.length + 1) / max
      });
      if (dbs.length > 1) {
        return (syncDB(dbs.slice(1), max) as any)(dispatch, getState);
      } else {
        setTimeout(() =>
          dispatch({
            type: END_SYNC
          }), 250);
      }
    });
  }
}
function sync (): thunk.ThunkAction<void, Defs.CompactdState, void>  {
  return (dispatch, getState) => {
    if (getState().app.syncing) {
      return;
    }
    const dbs = ['config', 'artists', 'albums', 'tracks', 'files', 'trackers'];

    (syncDB(dbs, dbs.length) as any)(dispatch, getState);
  }
}

export const actions = {
  sync, fetchState
}
