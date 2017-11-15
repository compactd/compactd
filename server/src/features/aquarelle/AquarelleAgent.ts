import {Album, Artist} from 'compactd-models';
import {MediaSource} from '../datasource';
import PouchDB from '../../database';
import * as fs from 'fs';
import * as path from 'path';
import * as mkdirp from 'mkdirp';
import * as sharp from 'sharp';
import * as mime from 'mime';
import config from '../../config';
import * as md5 from 'md5';
import {mainStory} from 'storyboard';

async function reset() {
  const artworks = new PouchDB("artworks");
  await artworks.destroy({

  })
}

async function saveToFile(promise: Promise<Buffer>, id: string) {
  const buffer = await promise;
  const image = sharp(buffer);

  const metadata = await image.metadata();
  const mimeType = mime.getType(metadata.format);

  mainStory.info('aquarelle', `Saving artwork for ${id} (width=${metadata.width}, mime=${mimeType})`)

  const artworks = new PouchDB('artworks');
  const docId = 'artworks/' + id;
  const smallImage = await image.resize(64).toBuffer();
  try {
    await artworks.put({
      _id: docId,
      owner: id,
      date: Date.now(),
      _attachments: {
        'large': {
          content_type: mimeType,
          data: buffer,
          digest: 'md5-' + md5(buffer)
        },
        'small': {
          content_type: mimeType,
          data: smallImage,
          digest: 'md5-' + md5(smallImage)
        }
      }
    });
  } catch (err) {
    if (err.status === 409) return;
    mainStory.warn('aquarelle', 'Could not save artwork for ' + id, {attach: err});
  }
}

async function processAlbums (onFetchAlbum: Function = new Function()) {
  const albums  = new PouchDB<Album>('albums');
  const artists = new PouchDB<Album>('artists');
  const source  = new MediaSource(config.get('datasourceKey'));

  await Promise.all((await albums.allDocs({include_docs: true}))
    .rows.map(async ({doc}) => {
      // if (fs.existsSync(getCacheEntry(doc._id)) && !replace) return;
      const artist = await artists.get(doc.artist);
      onFetchAlbum(doc.name);
      await saveToFile(source.getAlbumCover(artist.name, doc.name), doc._id);
  }));
}

async function processArtists (onFetchArtist: Function = new Function()) {
  const artists = new PouchDB<Album>('artists');
  const source  = new MediaSource(config.get('datasourceKey'));

  await Promise.all((await artists.allDocs({include_docs: true}))
    .rows.map(async ({doc}) => {
    // if (fs.existsSync(getCacheEntry(doc._id)) && !replace) return;
    onFetchArtist(doc.name);
    try {
      await saveToFile(source.getArtistArtwork(doc.name), doc._id);
    } catch (err) {
      return;
    }
  }));
}

export {processArtists, processAlbums, reset};
