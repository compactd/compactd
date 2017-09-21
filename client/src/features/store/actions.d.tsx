import {Artist, Album} from 'definitions';
import {DSEntity, DSArtist, DSAlbum, Release} from 'compactd-models';

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
export interface SelectResultsAction {
  type: 'cassette/store/SELECT_RESULTS';
  album: string;
}
export interface ResolveResultsAction {
  type: 'cassette/store/RESOLVE_RESULTS';
  results: Release [];
  id: string;
}
export interface DownloadResult {
  type: 'cassette/store/DOWNLOAD_RESULT';
  result: {
    id: string;
    event: string;
    token: string;
    album: DSAlbum;
    name: string;
    progress: number;
  }
}
export interface UpdateProgress {
  type: 'cassette/store/UPDATE_DL_PROGRESS';
  id: string;
  progress: number;
}
export type StoreAction =
  ToggleDownloadsAction
  | ToggleSearchAction
  | SetSearchResultsAction
  | ResolveDSArtistAction
  | SelectDSArtistAction
  | ResolveDSAlbumAction
  | SelectDSAlbumAction
  | SelectResultsAction
  | ResolveResultsAction
  | DownloadResult
  | UpdateProgress;

export type StoreActions = {
  toggleDownloads: () => void;
  toggleSearch: () => void;
  searchDatasource: (q: string) => void;
  selectDSArtist: (artist: string) => void;
  selectDSAlbum: (album: string) => void;
  goBackToSearch: () => void;
  loadResults: (artist: string, album: string) => void;
  downloadResult: (release: Release, album: DSAlbum) => void;
}
