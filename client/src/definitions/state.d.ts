import * as Compactd from './common.d';

export interface LibraryState {
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

export interface CompactdState {
  library: LibraryState;
  player: PlayerState;
  app: AppState;
}
