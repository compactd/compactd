import * as stream from 'stream';
import {DSAlbum, DSArtist, DSTrack} from 'compactd-models';

type Cover = Buffer;
type EntityType = 'artist' | 'album' | 'track';
type DSEntity = DSAlbum | DSArtist | DSTrack;

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
