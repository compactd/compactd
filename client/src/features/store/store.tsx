import * as Defs from 'definitions';
import Toaster from 'app/toaster';
import { StoreAction } from './actions.d';
import {Tracker, DSAlbum, Release} from 'compactd-models';
import PouchDB from 'pouchdb';
import * as qs from 'querystring';
import * as jwtDecode from 'jwt-decode';
import * as io from 'socket.io-client';
import Socket from 'app/socket';

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
          [action.result.id]: action.result
        })
      });
    case UPDATE_DL_PROGRESS:
      return Object.assign({}, state, {
        downloadsById: Object.assign({}, state, {
          [action.id]: Object.assign({}, state.downloadsById[action.id], {
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
    const res = fetch('/api/datasource/search?query=' + q, {
      headers: {
        'Authorization': 'Bearer ' + window.sessionStorage.getItem('session_token')
    }}).then((res) => res.json())
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
    const res = fetch('/api/datasource/artists/' + artist, {
      headers: {
        'Authorization': 'Bearer ' + window.sessionStorage.getItem('session_token')
    }}).then((res) => res.json())
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
    const res = fetch('/api/datasource/albums/' + album, {
      headers: {
        'Authorization': 'Bearer ' + window.sessionStorage.getItem('session_token')
    }}).then((res) => res.json())
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
    
    const Trackers = new PouchDB<Tracker>('trackers');
    const trackers = await Trackers.allDocs({include_docs: true});

    const res = await Promise.all(trackers.rows.map(async ({doc}) => {
      if (doc._id === '_design/validator') return [];
      const query = qs.stringify({name: album, artist});
      const res = await fetch(`/api/cascade/${doc._id}/search?${query}`, {
        headers: {
          'Authorization': 'Bearer ' + window.sessionStorage.getItem('session_token')
      }})
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

  const dl = JSON.parse(localStorage.getItem('pending_downloads') || '[]');
  return (dispatch: (action: StoreAction) => void, getState: () => Defs.CompactdState) => {
    dl.forEach((res: any) => { 
      dispatch({
        type: DOWNLOAD_RESULT,
        result: res
      });


      Socket.listen(res.event, res.token, (data: any) => {
        dispatch({
          type: UPDATE_DL_PROGRESS,
          id: res.id,
          progress: data.progress
        });
      });
    });
  };
}

function downloadResult (release: Release, album: DSAlbum) {
  
  return async (dispatch: (action: StoreAction) => void, getState: () => Defs.CompactdState) => {
    
    const res = await fetch(`/api/cascade/${release._id}/download`, {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer ' + window.sessionStorage.getItem('session_token')
    }});
    const data = await res.json();
    const {store} = getState();
    const {event} = jwtDecode(data.event) as any;
    dispatch({
      type: DOWNLOAD_RESULT,
      result: {
        id: release._id,
        event: event,
        token: data.event,
        album: album,
        name: data.name,
        progress: 0
      }
    });
    const dl = JSON.parse(localStorage.getItem('pending_downloads') || '[]');
    localStorage.setItem('pending_downloads', JSON.stringify([].concat(dl, [{
      id: release._id,
      event: event,
      token: data.event,
      album: Object.assign({}, album, {tracks: undefined}),
      name: data.name,
      progress: 0
    }])));


    Socket.listen(event, data.event, (data: any) => {
      dispatch({
        type: UPDATE_DL_PROGRESS,
        id: release._id,
        progress: data.progress
      });
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