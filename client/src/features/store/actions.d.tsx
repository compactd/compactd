import {Artist, Album} from 'definitions';
import {DSEntity, DSArtist, DSAlbum} from 'compactd-models';

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

export interface SelectDSArtistAction {
  type: 'cassette/store/SELECT_DS_ARTIST',
  artist: string;
}

export interface ResolveDSArtistAction {
  type: 'cassette/store/RESOLVE_DS_ARTIST';
  artist: DSArtist;
  id: string;
}

export interface SelectDSAlbumAction {
  type: 'cassette/store/SELECT_DS_ALBUM';
  album: string;
}

export interface ResolveDSAlbumAction {
  type: 'cassette/store/RESOLVE_DS_ALBUM';
  album: DSAlbum;
  id: string;
}

export interface SetStoreScopeAction {
  type: 'cassette/store/SET_STORE_SCOPE';
  scope: 'artist' | 'album' | 'search';
}

export type StoreAction =
  ToggleDownloadsAction
  | ToggleSearchAction
  | SetSearchResultsAction
  | ResolveDSArtistAction
  | SelectDSArtistAction
  | ResolveDSAlbumAction
  | SelectDSAlbumAction;

export type StoreActions = {
  toggleDownloads: () => void;
  toggleSearch: () => void;
  searchDatasource: (q: string) => void;
  selectDSArtist: (artist: string) => void;
  selectDSAlbum: (album: string) => void;
  goBackToSearch: () => void;
}
