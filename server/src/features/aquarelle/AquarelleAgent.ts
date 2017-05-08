import {Album, Artist} from 'compactd-models';
import {MediaSource} from '../datasource';
import PouchDB from '../../database';
import * as fs from 'fs';
import * as path from 'path';
import * as mkdirp from 'mkdirp';
import config from '../../config';

function getCacheEntry (id: string) {
  return path.join(config.get('dataDirectory'), 'aquarelle', new Buffer(id).toString('base64'));
}

function saveToFile(promise: Promise<Buffer>, id: string) {
  return new Promise((resolve, reject) => {
    promise.then((buffer) => {
      const target = getCacheEntry(id);
      mkdirp.sync(path.dirname(target));
      fs.writeFile(target, buffer, (err) => {
        if (err) return reject(err);
        resolve();
      });
    });
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
    await saveToFile(source.getArtistArtwork(doc.name), doc._id);
  }));
}

export {processArtists, processAlbums, getCacheEntry};