import {Album, Artist, File} from 'compactd-models';
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
import jwt from '../../jwt';

const gis = require('g-i-s');

async function reset() {
  const artworks = new PouchDB("artworks");
  await artworks.destroy({

  })
}

async function saveToFile(promise: Promise<Buffer>, id: string) {
  if (!promise) return;

  const buffer = await promise;

  if (!buffer) return;
  try {
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
      console.log(err);
      return;
    }
  }));
}

function searchGoogleImage (query: string): Promise<any[]> {
  return new Promise((resolve, reject) => {
    gis(query, (err: Error, res: any[]) => {
      if (err) return reject(err);
      resolve(res);
    });
  })
}

function findLocalArtworks (dir: string): Promise<string[]> {
  return new Promise((resolve, reject) => {
    fs.readdir(dir, (err, files) => {
      if (err) return reject(err);

      resolve(files.filter((file) => {
        const abs = path.join(dir, file);
        return file.toLowerCase().endsWith('.jpg') && fs.lstatSync(abs).isFile();
      }).map((f) => {
        return path.join(dir, f);
      }));
    })
  });
}

function createFileToken (file: string) {
  return jwt.sign({
    source: 'local',
    file
  })
}

function createURLToken (url: string) {
  return jwt.sign({
    source: 'remote',
    url
  })
}

function createLocalEntry (file: string) {
  return sharp(file).metadata().then((data) => {
    return {
      token: createFileToken(file),
      dimensions: [data.width, data.height]
    }
  })
}

async function findArtworks (id: string) {
  const files = new PouchDB<File>('files');
  const albums = new PouchDB<Album>('albums');
  const artists = new PouchDB<Artist>('artists');

  const fileId = (await files.allDocs({
    include_docs: false,
    startkey: id,
    endkey: id + '\uffff'
  })).rows[0].id;
  const album = await albums.get(id);
  const artist = await artists.get(album.artist);

  const file = await files.get(fileId);

  const folder = path.dirname(file.path);

  const local = (await findLocalArtworks(folder)).map(createLocalEntry);

  const results = (await searchGoogleImage(`${artist.name} - ${album.name}`)).map((res) => {
    return {
      url: res.url,
      dimensions: [res.width, res.height]
    }
  });

  return {results, local};
}

export {processArtists, processAlbums, reset, findArtworks};
