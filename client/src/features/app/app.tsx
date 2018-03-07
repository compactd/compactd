import * as Defs from 'definitions';
import { AppAction } from './actions.d';
import PouchDB from 'pouchdb-browser';
import * as thunk from 'redux-thunk';
import * as jwt from 'jwt-decode';
import {getDatabase, getHttpDatabase} from 'app/database';
import Toaster from 'app/toaster';
import Socket from 'app/socket';
import Artwork from 'app/Artwork';
import Session from 'app/session';
import * as hash from 'md5';
import { wrapDatabaseFromState } from 'definitions/utils';
import { Databases, AppError } from 'definitions/state';


export enum ActionTypes {
  RESOLVE_STATE = 'compactd/app/RESOLVE_STATE',
  SET_USER = 'compactd/app/SET_USER',
  START_SYNC = 'compactd/app/START_SYNC',
  UPDATE_SYNC = 'compactd/app/UPDATE_SYNC',
  END_SYNC = 'compactd/app/END_SYNC',
  SHOW_ERROR = 'compactd/app/SHOW_ERROR',
  SET_ORIGIN = 'compactd/app/SET_ORIGIN',
  RESET_APP = 'compactd/app/RESET_APP',
  SET_ERROR = 'compactd/app/SET_ERROR'
}

const initialState: Defs.AppState = {
  loading: false,
  syncing: false,
  configured: true,
  synced: false,
  databases: {}
};

export function reducer (state: Defs.AppState = initialState,
  action: AppAction): Defs.AppState {
  switch (action.type) {
    case ActionTypes.SET_ERROR:
      return {
        ...state,
        error: action.error
      }
    case ActionTypes.RESET_APP:
      return initialState;
    case ActionTypes.SET_ORIGIN:
      const prefix = hash(action.origin).substring(0, 6) + '_';
      return {
        ...state,
        origin: action.origin,
        loading: true,
        databases: {
          artists: prefix + 'artists',
          albums: prefix + 'albums',
          tracks: prefix + 'tracks',
          downloads: prefix + 'downloads',
          trackers: prefix + 'trackers',
          files: prefix + 'files',
          libraries: prefix + 'libraries',
          stores: prefix + 'stores',
          artworks: prefix + 'artworks',
          origin: action.origin
        }
      }
    case ActionTypes.SET_USER:
      return Object.assign({}, state, {user: action.user});
    case ActionTypes.RESOLVE_STATE:
      return Object.assign({}, state, {
        loading: false,
        configured: action.configured,
        user: action.user
      });
    case ActionTypes.START_SYNC:
      return Object.assign({}, state, {
        syncing: true,
        syncingProgress: 0
      });
    case ActionTypes.UPDATE_SYNC:
      return Object.assign({}, state, {
        syncingProgress: action.progress
      });
    case ActionTypes.END_SYNC:
      return Object.assign({}, state, {
        syncingProgress: 1,
        syncing: false,
        synced: true
      });
  }
  return state;
}

const login = wrapDatabaseFromState(function (databases, username: string, password: string) {
  return Session.signIn(databases.origin, username, password).then((token) => {
    return {type: ActionTypes.SET_USER, user: token.user};
  }).catch((err) => {
    Toaster.error(err);
  });
});

const fetchState = wrapDatabaseFromState(function ({origin}) {
  return new Promise((resolve, reject) => {
    setTimeout(resolve, 400);
  }).then(() => {
    return Session.getStatus(origin);
  }).then((status) => {
    if (status.user) {
      Artwork.createInstance(PouchDB);
      return {
        type: ActionTypes.RESOLVE_STATE,
        configured: true,
        user: Session.getUser(origin)
      }
    } else {
      Toaster.error('Invalid or expired token');
    }
    return {
      type: ActionTypes.RESOLVE_STATE,
      configured: true
    }
  }).catch((err: Error) => {
    console.log(err);
    if (err.message.match(/Failed to fetch/)) {
      return {type: ActionTypes.SET_ERROR, error: AppError.FetchFailed};
    }
    if (err.message.match(/Unexpected token/)) {
      return {type: ActionTypes.SET_ERROR, error: AppError.FetchFailed};
    }
  });
});

function syncDB (origin: string, dbs: string[], max: number): thunk.ThunkAction<void, Defs.CompactdState, void>  {
  return async (dispatch, getState) => {
    const dbName = dbs[0];
    const db = new PouchDB((getState().app.databases as any)[dbName]);
    const remote = getHttpDatabase(origin, dbName);
    db.replicate.from(remote).on('complete', (info) => {
      dispatch({
        type: ActionTypes.UPDATE_SYNC,
        progress: (max - dbs.length + 1) / max
      });
      getDatabase(origin, dbName).then((remotedb) => {
        db.sync(remotedb, {live: true, retry: true, timeout: 0}).on('change', (info) => {
          console.log('sync received change for', dbName, info);
          
        }).on('error', (err: any) => {
          console.log('err', err, err.stack);
          Toaster.error(`An error happened during live database sync for ${dbName}: ${err.message}`);
        }).on('paused', function (info) {});
      });

      if (dbs.length > 1) {
        return (syncDB(origin, dbs.slice(1), max) as any)(dispatch, getState);
      } else {
        setTimeout(() =>
          
          dispatch({
            type: ActionTypes.END_SYNC
          }), 150);
      }
    }).on('error', (err: any) => {
      console.trace(err, err.stack);
      Toaster.error(`An error happened during database sync for ${dbName}: ${err.code}`);
    });
  }
}
function sync (origin: string): thunk.ThunkAction<void, Defs.CompactdState, void>  {
  return (dispatch, getState) => {
    if (getState().app.syncing) {
      return;
    }

    dispatch({type: ActionTypes.START_SYNC});

    const dbs = [ 'artists', 'albums', 'tracks', 'artworks', 'files', 'trackers', 'libraries'];

    (syncDB(origin, dbs, dbs.length) as any)(dispatch, getState);
    Socket.connect(origin);
  }
}

function resetApplication () {
  return {type: ActionTypes.RESET_APP};
}

function setOrigin (origin: string) {
  return {type: ActionTypes.SET_ORIGIN, origin};
}

export const actions = {
  sync, fetchState, login, resetApplication, setOrigin
}
