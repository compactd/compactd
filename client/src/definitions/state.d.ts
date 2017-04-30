import * as Compactd from './common.d';

export interface ILibraryState {
  albumsById: {
    [id: string]: Compactd.IAlbum & {tracks?: [Compactd.ITrack]}
  };
  artistsById: {
    [id: string]: Compactd.IArtist & {albums?: [Compactd.IAlbum]}
  };
  albums: Compactd.IAlbum[];
  artists: Compactd.IArtist[];
  tracks: Compactd.ITrack[];
}

export interface IPlayerState {
  /**
   * An array containing a list of the next tracks
   */
  nextTracks: [Compactd.ITrack];
  /**
   * Previously-player tracks
   */
  prevTracks: [Compactd.ITrack];
  /**
   *  Currently playing track
   */
  current:    Compactd.ITrack;
  /**
   * Is it playing right now?
   */
  playing:    boolean;
}

export interface ICompactdState {
  library: ILibraryState;
  player: IPlayerState;
}
