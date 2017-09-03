import * as Defs from 'definitions';
import { StoreAction } from './actions.d';

const TOGGLE_DOWNLOADS   = 'cassette/store/TOGGLE_DOWNLOADS';
const TOGGLE_SEARCH      = 'cassette/store/TOGGLE_SEARCH';
const SET_SEARCH_RESULTS = 'cassette/store/SET_SEARCH_RESULTS';
const SELECT_DS_ARTIST   = 'cassette/store/SELECT_DS_ARTIST';
const RESOLVE_DS_ARTIST  = 'cassette/store/RESOLVE_DS_ARTIST';
const SET_STORE_SCOPE    = 'cassette/store/SET_STORE_SCOPE';
const RESOLVE_DS_ALBUM   = 'cassette/store/RESOLVE_DS_ALBUM';
const SELECT_DS_ALBUM    = 'cassette/store/SELECT_DS_ALBUM';

const initialState: Defs.StoreState = {
  showDowloadPopup: false,
  showSearchDialog: false,
  search: '',
  searchResultsByQuery: {},
  artistsById: {},
  albumsById: {},
  scope: 'search',
  artist: '',
  album: ''
};

export function reducer (state: Defs.StoreState = initialState,
  action: StoreAction): Defs.StoreState {
  switch (action.type) {
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
    });
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
  searchDatasource, toggleSearch, selectDSArtist, goBackToSearch, selectDSAlbum
}