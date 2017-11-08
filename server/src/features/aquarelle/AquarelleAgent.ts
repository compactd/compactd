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

function getCacheEntry (id: string) {
  return path.join(config.get('dataDirectory'), 'aquarelle', new Buffer(id).toString('base64'));
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
}

async function processAlbums (replace: boolean = false) {
  const albums  = new PouchDB<Album>('albums');
  const artists = new PouchDB<Album>('artists');
  const source  = new MediaSource(config.get('datasourceKey'));

  await Promise.all((await albums.allDocs({include_docs: true}))
    .rows.map(async ({doc}) => {
    if (fs.existsSync(getCacheEntry(doc._id)) && !replace) return;
    const artist = await artists.get(doc.artist);
    await saveToFile(source.getAlbumCover(artist.name, doc.name), doc._id);
  }));
}

async function processArtists (replace: boolean = false) {
  const artists = new PouchDB<Album>('artists');
  const source  = new MediaSource(config.get('datasourceKey'));

  await Promise.all((await artists.allDocs({include_docs: true}))
    .rows.map(async ({doc}) => {
    if (fs.existsSync(getCacheEntry(doc._id)) && !replace) return;
    try {
      await saveToFile(source.getArtistArtwork(doc.name), doc._id);
    } catch (err) {
      return;
    }
  }));
}

export {processArtists, processAlbums, getCacheEntry};
