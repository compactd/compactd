import {DataSource} from './DataSource';
import fetch from 'node-fetch';
import * as qs from 'qs';
import * as imageSize from 'image-size';

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
    console.log(`http://ws.audioscrobbler.com/2.0/?${q}`)
    const res = await fetch(`http://ws.audioscrobbler.com/2.0/?${q}`);
    const data = await res.json();

    const images = data.album.image;
    return this.fetchLargestImage(images);
  }
}