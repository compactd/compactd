import * as Compactd from './common.d';
import {DSAlbum, DSArtist, DSTrack, DSEntity, Library, Tracker, Release} from 'compactd-models';

export interface LibraryState {
  topTracks: {key: string, value: number}[],
  tracksById: {
    [id: string]: Compactd.Track
  }
  albumsById: {
    [id: string]: Compactd.Album & {tracks?: [Compactd.Track]}
  };
  artistsById: {
    [id: string]: Compactd.Artist & {albums?: [Compactd.Album]}
  };
  albums: Compactd.Album[];
  artists: Compactd.Artist[];
  tracks: Compactd.Track[];
  expandArtists: boolean;
  counters: {
    [id: string]: {
      tracks: number;
      albums?: number;
    }
  }
}

export interface AppState {
  loggingIn?: boolean;
  /**
   * Whether the app is loading the state
   */
  loading: boolean;
  /**
   * Whether app has been configured, and server is ready to be used
   */
  configured: boolean;
  /**
   * Is the app loading, syncing the databases?
   */
  syncing: boolean;
  /**
   * Syncing progress between  0 and 1
   */
  syncingProgress?: number;
  synced: boolean;
  /**
   * Logged in user
   */
  user?: string;
}

export interface PlayerState {
  /**
   * An array containing a list of the next tracks
   */
  stack: Compactd.Track[];
  /**
   * Previously-player tracks
   */
  prevStack: Compactd.Track[];
  /**
   * Is it playing right now?
   */
  playing:    boolean;
}

export interface StoreState {
  search: string;
  showSearchDialog: boolean;
  showDowloadPopup: boolean;
  searchResultsByQuery: {
    [q: string]: {
      artist?: DSArtist[],
      album?: DSAlbum[],
      track?: DSTrack[] 
    }
  };
  scope: 'artist' | 'album' | 'search' | 'results';
  artist: string;
  album: string;
  resultsById: {
    [name: string]: Release[]
  }
  artistsById: {
    [name: string]: DSArtist
  };
  albumsById: {
    [name: string]: DSAlbum
  },
  downloadsById: {
    [id: string]: {
      id: string;
      event: string;
      token: string;
      album: DSAlbum;
      name: string;
      progress: number;
    }
  }
}

export interface SettingsState {
  scanning: boolean;
  opened: boolean;
  libraries?: Library[];
  trackers?: Tracker[];
}

export interface CompactdState {
  library: LibraryState;
  player: PlayerState;
  app: AppState;
  store: StoreState;
  settings: SettingsState;
}
