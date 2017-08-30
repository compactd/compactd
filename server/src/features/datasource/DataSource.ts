import * as stream from 'stream';

type Cover = Buffer;
type EntityType = 'artist' | 'album' | 'track';

export interface DSArtist {
  type: 'artist';
  name: string;
  id: string;
  cover?: string;
  _data?:  {
    [name: string]: string | number
  };
}

export interface DSAlbum {
  type: 'album';
  name: string;
  id: string;
  artist: string;
  cover?: string;
  _data?: {
    [name: string]: string | number
  };
}

export interface DSTrack {
  type: 'track';
  name: string;
  id: string;
  artist: string;
  album?: string;
  number?: number;
  duration?: number;
  _data?: {
    [name: string]: string | number
  };
}

export type DSEntity = DSArtist | DSAlbum | DSTrack;

export abstract class DataSource {
  protected apiKey: string;
  constructor (apiKey: string) {
    this.apiKey = apiKey;
  }
  abstract initialize (): Promise<void>;
  abstract getAlbumCover (artist: string, album: string): Promise<Cover>;
  abstract getArtistArtwork (artist: string): Promise<Cover>;
  abstract search (query: string, type?: EntityType[]): Promise<DSEntity[]>;
  abstract autocomplete (query: string, type?: EntityType[]): Promise<DSEntity[]>;
  abstract getArtistById (id: string): Promise<DSArtist>;
  abstract getAlbumById (id: string): Promise<DSAlbum>;
  abstract getTrackById (id: string): Promise<DSTrack>;
}
