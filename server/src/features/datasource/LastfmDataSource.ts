import {DataSource} from './DataSource';
import {DSAlbum, DSArtist, DSTrack} from 'compactd-models';
import fetch from 'node-fetch';
import * as qs from 'qs';
import * as imageSize from 'image-size';
import * as config from '../../config';
import * as jwt from 'jsonwebtoken';
import {mainStory} from 'storyboard';

const LAST_FM_SIZES = ['mega', 'extralarge', 'large', 'medium', 'small', ''];

export class LastfmDataSource extends DataSource {
  initialize(): Promise<void> {
    return Promise.resolve();
  }

  /**
   * This method will download the first image from images which
   * size is the first element of sizes. If the image is almost a square
   * that is to say the difference between its height and width is inferior
   * to about 5% of its height then it will return the image as a buffer;
   * Otherwise, or if the image cannot be fetched, this will either return
   * the result of fetchLargestImage called with images and sizes minus the first element
   * or an empty buffer (new Buffer('')) if sizes doesn't have an element left
   * @param images an array of the image object returned by LastFM
   * @param sizes an array of LastFM sizes, sorted by size
   * @return a buffer containing the image if found
   */
  private async fetchLargestImage (images: {'#text': string, size: 'string'}[],
    sizes: typeof LAST_FM_SIZES = LAST_FM_SIZES): Promise<Buffer> {
    const match = images.find((el) => el.size === sizes[0]);
    if (!match) {
      if (sizes.length === 1) return;
      return this.fetchLargestImage(images, sizes.slice(1));
    }
    try {
      const res = await fetch(match['#text']);
      const buffer = await res.buffer();

      const dims = imageSize(buffer);
      if (Math.abs(dims.height - dims.width) < 0.05 * dims.height ) {
        return buffer;
      }
    } catch (err) {}

    if (sizes.length === 1) return new Buffer('');
    return this.fetchLargestImage(images, sizes.slice(1));

  }

  async getArtistArtwork(artist: string): Promise<Buffer> {
    const q = qs.stringify({
      method: 'artist.getinfo',
      api_key: this.apiKey,
      format: 'json',
      artist
    });
    const res = await fetch(`http://ws.audioscrobbler.com/2.0/?${q}`);
    const data = await res.json();
    if (!data.artist) return;
    const images = data.artist.image;
    return this.fetchLargestImage(images);
  }

  async getAlbumCover(artist: string, album: string): Promise<Buffer> {
    const q = qs.stringify({
      method: 'album.getinfo',
      api_key: this.apiKey,
      format: 'json',
      artist, album
    });
    // console.log(`http://ws.audioscrobbler.com/2.0/?${q}`)
    const res = await fetch(`http://ws.audioscrobbler.com/2.0/?${q}`);
    const data = await res.json();

    if (!data.album) return;
    const images = data.album.image;
    return this.fetchLargestImage(images);
  }
  search(query: string, types: ("artist" | "album" | "track")[] = ['artist', 'album', 'track']): Promise<(DSArtist | DSAlbum | DSTrack)[]> {
    if (!types.every((t) => ['artist', 'album', 'track'].includes(t))) {
      throw new Error('Trying to search for unknown type');
    }

    mainStory.info('datasource', `Performing search for '${query}'`);

    return Promise.all(types.map(async (type) => {
      const q = qs.stringify({
        method: type + '.search',
        api_key: this.apiKey,
        format: 'json',
        [type]: query
      });
      const time = Date.now();

      const res = await fetch(`http://ws.audioscrobbler.com/2.0/?${q}`);
    
      const data = await res.json();

      mainStory.debug('datasource', `GET http://ws.audioscrobbler.com/2.0/?${q} ${Date.now() - time} ms`, {
        attach: data, attachLevel: 'trace'
      });
      const results: (DSArtist | DSAlbum | DSTrack)[] = data.results[`${type}matches`][type].map((item: any) => {
    
        const cover = (item.image || []).reduce((acc: any, val: any) => {
          return Object.assign({}, acc, {[val.size]: val['#text']});
        }, {});

        

        // const coverURI = `/api/datasource/cover/${new Buffer(JSON.stringify(cover)).toString('base64')}`;

        return Object.assign({}, {
          type,
          name: item.name,
          id: item.name,
          cover: cover.extralarge
        }, item.artist ? {artist: item.artist} : {});
      });
      return results;
      
    })).then((values) => {
      return [].concat(...values);
    });
  }
  autocomplete(query: string, type?: ("artist" | "album" | "track")[]): Promise<(DSArtist | DSAlbum | DSTrack)[]> {
    throw new Error("Method not implemented.");
  }
  getArtistById(id: string): Promise<DSArtist> {
    throw new Error("Method not implemented.");
  }
  getAlbumById(id: string): Promise<DSAlbum> {
    throw new Error("Method not implemented.");
  }
  getTrackById(id: string): Promise<DSTrack> {
    throw new Error("Method not implemented.");
  }
}
