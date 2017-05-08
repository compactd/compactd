import * as stream from 'stream';

type Cover = Buffer;

export abstract class DataSource {
  protected apiKey: string;
  constructor (apiKey: string) {
    this.apiKey = apiKey;
  }
  abstract initialize (): Promise<void>;
  abstract getAlbumCover (artist: string, album: string): Promise<Cover>;
  abstract getArtistArtwork (artist: string): Promise<Cover>;
}
