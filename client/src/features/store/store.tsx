import * as Defs from 'definitions';
import Toaster from 'app/toaster';
import { StoreAction } from './actions.d';
import {Tracker, DSAlbum, Release} from 'compactd-models';
import PouchDB from 'pouchdb';
import * as qs from 'querystring';
import * as jwtDecode from 'jwt-decode';
import * as io from 'socket.io-client';
import Socket from 'app/socket';
import Session from 'app/session';

const TOGGLE_DOWNLOADS   = 'cassette/store/TOGGLE_DOWNLOADS';
const TOGGLE_SEARCH      = 'cassette/store/TOGGLE_SEARCH';
const SET_SEARCH_RESULTS = 'cassette/store/SET_SEARCH_RESULTS';
const SELECT_DS_ARTIST   = 'cassette/store/SELECT_DS_ARTIST';
const RESOLVE_DS_ARTIST  = 'cassette/store/RESOLVE_DS_ARTIST';
const SET_STORE_SCOPE    = 'cassette/store/SET_STORE_SCOPE';
const RESOLVE_DS_ALBUM   = 'cassette/store/RESOLVE_DS_ALBUM';
const SELECT_DS_ALBUM    = 'cassette/store/SELECT_DS_ALBUM';
const SELECT_RESULTS     = 'cassette/store/SELECT_RESULTS';
const RESOLVE_RESULTS    = 'cassette/store/RESOLVE_RESULTS';
const DOWNLOAD_RESULT    = 'cassette/store/DOWNLOAD_RESULT';
const UPDATE_DL_PROGRESS = 'cassette/store/UPDATE_DL_PROGRESS';

const initialState: Defs.StoreState = {
  showDowloadPopup: false,
  showSearchDialog: false,
  search: '',
  searchResultsByQuery: {},
  artistsById: {},
  albumsById: {},
  scope: 'search',
  artist: '',
  album: '',
  resultsById: {},
  downloadsById: {}
};

export function reducer (state: Defs.StoreState = initialState,
  action: StoreAction): Defs.StoreState {
  switch (action.type) {
    case DOWNLOAD_RESULT:
      return Object.assign({}, state, {
        downloadsById: Object.assign({}, state.downloadsById, {
          [action.result.hash]: action.result
        })
      });
    case UPDATE_DL_PROGRESS:
      return Object.assign({}, state, {
        downloadsById: Object.assign({}, state, {
          [action.hash]: Object.assign({}, state.downloadsById[action.hash], {
            progress: action.progress
          })
        })
      });
    case SELECT_RESULTS:
      return Object.assign({}, state, {
        scope: 'results'
      });
    case RESOLVE_RESULTS:
      return Object.assign({}, state, {
        resultsById: Object.assign({}, state.resultsById, {
          [action.id]: action.results
        })
      });
    case RESOLVE_DS_ALBUM:
      return Object.assign({}, state, {
        albumsById: Object.assign({}, state.albumsById, {
          [action.id]: action.album
        })
      });
    case SELECT_DS_ALBUM:
      return Object.assign({}, state, {
        scope: 'album',
        album: action.album
      });
    case SELECT_DS_ARTIST:
      return Object.assign({}, state, {
        scope: 'artist',
        artist: action.artist
      });
    case RESOLVE_DS_ARTIST:
      return Object.assign({}, state, {
        artistsById: Object.assign({}, state.artistsById, {
          [action.id]: action.artist
        })
      });
    case TOGGLE_DOWNLOADS:
      return Object.assign({}, state, {
        showDownloadPopup: !state.showDowloadPopup
      });
    case TOGGLE_SEARCH:
      return Object.assign({}, state, {
        showSearchDialog: !state.showSearchDialog,
        search: '',
        scope: 'search'
      });
    case SET_SEARCH_RESULTS:
      return Object.assign({}, state, {
        searchResultsByQuery: Object.assign({}, 
          state.searchResultsByQuery, action.results ? {
            [action.query]: action.results
          } : {}), search: action.query
      });
  }
  return state;
}

function searchDatasource (q: string) {
  return (dispatch: (action: StoreAction) => void, getState: () => Defs.CompactdState) => {
    dispatch({
      type: SET_SEARCH_RESULTS,
      query: q
    })
    const res = Session.fetch(getState().app.origin, '/api/datasource/search?query=' + q).then((res) => res.json())
      .then((res) => {
        dispatch({
          type: SET_SEARCH_RESULTS,
          query: q, results: res
        });
    }).catch((err) => {
      Toaster.error(err);
    });
  }
}

function selectDSArtist (artist: string) {
  return (dispatch: (action: StoreAction) => void, getState: () => Defs.CompactdState) => {
    dispatch({
      type: SELECT_DS_ARTIST,
      artist
    })
    const res = Session.fetch(getState().app.origin, '/api/datasource/artists/' + artist).then((res) => res.json())
      .then((res) => {
        dispatch({
          type: RESOLVE_DS_ARTIST,
          artist: res,
          id: artist
        });
    }).catch((err) => {
      Toaster.error(err);
    });;
  }
}
function selectDSAlbum (album: string) {
  return (dispatch: (action: StoreAction) => void, getState: () => Defs.CompactdState) => {
    dispatch({
      type: SELECT_DS_ALBUM,
      album
    })
    const res = Session.fetch(getState().app.origin, '/api/datasource/albums/' + album).then((res) => res.json())
      .then((res) => {
        dispatch({
          type: RESOLVE_DS_ALBUM,
          album: res,
          id: album
        });
    }).catch((err) => {
      Toaster.error(err);
    });
  }
}
function loadResults (artist: string, album: string) {
  
  return async (dispatch: (action: StoreAction) => void, getState: () => Defs.CompactdState) => {
    dispatch({
      type: SELECT_RESULTS,
      album: album
    });
    
    const Trackers = new PouchDB<Tracker>(getState().app.databases.trackers);
    const trackers = await Trackers.allDocs({include_docs: true});

    const res = await Promise.all(trackers.rows.map(async ({doc}) => {
      if (doc._id === '_design/validator') return [];
      const query = qs.stringify({name: album, artist});
      const res = await Session.fetch(getState().app.origin, `/api/cascade/${doc._id}/search?${query}`)
      const data = await res.json();
      return data;
    }));

    dispatch({
      type: RESOLVE_RESULTS,
      id: `${artist}/${album}`,
      results: [].concat(...res)
    });
  }

}

function initResults () {
  return async (dispatch: (action: StoreAction) => void, getState: () => Defs.CompactdState) => {
    const res = await Session.fetch(getState().app.origin, '/api/cascade/downloads');
    const downloads = await res.json();
    downloads.forEach((res: any) => { 
      dispatch({
        type: DOWNLOAD_RESULT,
        result: res
      });
    });
    Socket.onClientCall('torrentProgress', (hash: string, progress: number) => {
      // if (hash !== data.hash) return;
      dispatch({
        type: UPDATE_DL_PROGRESS,
        hash, progress
      });
    });
  };
}

function downloadResult (release: Release, album: DSAlbum) {
  
  return async (dispatch: (action: StoreAction) => void, getState: () => Defs.CompactdState) => {
    
    const res = await Session.fetch(getState().app.origin, `/api/cascade/${release._id}/download`, {
      method: 'POST',
      body: null,
      headers: {}
    });
    
    const data = await res.json();
    const {store} = getState();

    dispatch({
      type: DOWNLOAD_RESULT,
      result: {
        id: release._id + '/' + data.hash,
        hash: data.hash,
        name: data.name
      }
    });
  }
}
function goBackToSearch () {
  return {
    type: SET_STORE_SCOPE,
    scope: 'search'
  };
}

function toggleSearch () {
  return {
    type: TOGGLE_SEARCH
  }
}


export const actions = {
  searchDatasource, toggleSearch, selectDSArtist, goBackToSearch, selectDSAlbum, loadResults, downloadResult, initResults
}