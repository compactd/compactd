export type IDatabaseID = number;

export interface IArtist {
  name: string;
  _id: IDatabaseID;
}

export interface IAlbum {
  name: string;
  artist: IArtist;
  _id: IDatabaseID;
}

export interface IUAlbum {
  name: string;
  artist: IDatabaseID;
  _id: IDatabaseID;
}
/**
 * Represents an album track
 */
export interface ITrack {
  name: string;
  number?: number;
  _id: IDatabaseID;
  artist: IArtist;
  track_artist?: string;
  album: IAlbum;
}

export interface IUTrack {
  name: string;
  number?: number;
  _id: IDatabaseID;
  artist: IDatabaseID;
  track_artist?: string;
  album: IDatabaseID;
}
