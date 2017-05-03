export type DatabaseID = number;

export interface Artist {
  name: string;
  _id: DatabaseID;
}

export interface Album {
  name: string;
  artist: Artist;
  _id: DatabaseID;
}

export interface UAlbum {
  name: string;
  artist: DatabaseID;
  _id: DatabaseID;
}
/**
 * Represents an album track
 */
export interface Track {
  name: string;
  number?: number;
  _id: DatabaseID;
  artist: Artist;
  track_artist?: string;
  album: Album;
}

export interface UTrack {
  name: string;
  number?: number;
  _id: DatabaseID;
  artist: DatabaseID;
  track_artist?: string;
  album: DatabaseID;
}
