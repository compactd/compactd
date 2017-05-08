import {DataSource} from './DataSource';
import fetch from 'node-fetch';
const Blitzr: any = require('blitzr-js-sdk');


export class BlitzrDataSource extends DataSource {
  private blitzr: any;
  initialize(): Promise<void> {
    this.blitzr = new Blitzr(this.apiKey);
    return Promise.resolve();
  }
  getAlbumCover(artist: string, album: string): Promise<Buffer> {
    throw new Error('not implemented')
  }
  async getArtistArtwork(artist: string): Promise<Buffer> {
    const res = await this.blitzr.search.artist({query: artist});
    console.log(res);
    
    return new Buffer('');
  }


}