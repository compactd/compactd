import {Artist, Album} from 'definitions';
import {DSEntity} from 'compactd-models';

interface StoreActionBase {
  type: string;
};

export interface ToggleDownloadsAction {
  type: 'cassette/store/TOGGLE_DOWNLOADS';
}

export interface ToggleSearchAction {
  type: 'cassette/store/TOGGLE_SEARCH';
}

export interface SetSearchResultsAction {
  type: 'cassette/store/SET_SEARCH_RESULTS';
  query: string;
  results?: DSEntity[];
}

export type StoreAction = ToggleDownloadsAction | ToggleSearchAction | SetSearchResultsAction;
export type StoreActions = {
  toggleDownloads: () => void;
  toggleSearchAction: () => void;
  searchDatasource: (q: string) => void;
}
