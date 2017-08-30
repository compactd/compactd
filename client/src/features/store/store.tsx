import * as Defs from 'definitions';
import { StoreAction } from './actions.d';

const TOGGLE_DOWNLOADS   = 'cassette/store/TOGGLE_DOWNLOADS';
const TOGGLE_SEARCH      = 'cassette/store/TOGGLE_SEARCH';
const SET_SEARCH_RESULTS = 'cassette/store/SET_SEARCH_RESULTS';

const initialState: Defs.StoreState = {
  showDowloadPopup: false,
  showSearchDialog: false,
  search: '',
  searchResultsByQuery: {}
};

export function reducer (state: Defs.StoreState = initialState,
  action: StoreAction): Defs.StoreState {
  switch (action.type) {
    case TOGGLE_DOWNLOADS:
      return Object.assign({}, state, {
        showDownloadPopup: !state.showDowloadPopup
      });
    case TOGGLE_SEARCH:
      return Object.assign({}, state, {
        showSearchDialog: !state.showSearchDialog
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

export const actions = {
}