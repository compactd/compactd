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
}

export interface PlayerState {
  /**
   * An array containing a list of the next tracks
   */
  nextTracks: [Compactd.Track];
  /**
   * Previously-player tracks
   */
  prevTracks: [Compactd.Track];
  /**
   *  Currently playing track
   */
  current:    Compactd.Track;
  /**
   * Is it playing right now?
   */
  playing:    boolean;
}

export interface CompactdState {
  library: LibraryState;
  player: PlayerState;
}
