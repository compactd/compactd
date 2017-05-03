import * as Defs from './definitions';
import * as PouchDB from 'pouchdb';
import * as Database from '../../database';
import * as path from "path";
import { readFile, writeFile, existsSync } from "fs";
import * as mkdirp from 'mkdirp';
import Models = require('compactd-models');
import Ffmpeg = require('fluent-ffmpeg');
import FSTree = require('fs-tree-diff');

const walkSync = require('walk-sync');

class Scanner {
  entries: FSTree.FSEntries;
  library: string;
  path: string;
  constructor (path: string, library: string) {
    this.path = path;
    this.library = library;
  }

  async scan (pouchDB: typeof PouchDB) {
    this.walkDirectory();

    const patch = await this.getPatch();
    await patch.reduce((acc, entry) => {
      return acc.then(() => this.databaseEntryCreator(pouchDB, entry));
    }, Promise.resolve());
  }

  walkDirectory () {
    this.entries = walkSync(this.path);
  }

  getSerializedEntries (dir: string): Promise<FSTree.FSEntries> {
    const file = path.join(dir, `fstrees/${this.library}.entries.json`);

    return new Promise<FSTree.FSEntries>((resolve, reject) => {
      if (!existsSync(file)) resolve()
      readFile(file, 'utf8', function (err, content) {
        if (err) return reject (err);

        resolve((JSON.parse(content) as any).entries);
      });
    });
  }

  serializeEntries (dir: string): Promise<undefined> {
    mkdirp.sync(path.join(dir, 'fstree'));
    const file = path.join(dir, `fstree/${this.library}.entries.json`);

    return new Promise((resolve, reject) => {
      writeFile(file, JSON.stringify({entries: this.entries}), function (err) {
        if (err) return reject (err);

        resolve();
      });
    });
  }

  async getPatch () {
    const serialized = await this.getSerializedEntries('/home/vincent/.compactd/');
    const staled = FSTree.fromEntries(serialized);
    const current = FSTree.fromEntries(this.entries);

    return staled.calculatePatch(current);
  }

  ffprobe (path: string){
    return new Promise((resolve, reject) => {
      const ffmpeg = Ffmpeg();
      ffmpeg.ffprobe([path], (err, data) => {
        if (err) return reject(err);

        resolve(data);
      });
    });
  }
  async findOrCreateArtist (pouchDB: typeof PouchDB, name: string) {
    const artist = new pouchDB<Models.Artist>('artist');
    const uri = Models.artistURI({ name });
    try {
      const albumArtist = await artist.get(uri);
      return uri;
    } catch (err) {
      if (err.status === 404) {
        await artist.put({
          _id: uri,
          name
        });
        return uri;
      }
    }
  }
  async databaseEntryCreator (pouchDB: typeof PouchDB, [op, file, entry]: FSTree.PatchEntry) {
    switch (op) {
      case 'create': 
        const source = path.join(this.path, file);
        const probed: any = await this.ffprobe(source);
        
        const ext = path.extname(file);
        const tags = probed.format.tags;

        const artistName = tags.ALBUM_ARTIST || tags.album_artist || tags.artist || tags.ARTIST;
        const artistID = Models.artistURI(Models.mapArtistToParams({
          name: artistName
        }));

        const albumName = tags.album || tags.ALBUM;
        const albumID = Models.albumURI(Models.mapAlbumToParams({
          name: albumName,
          artist: artistID
        }));

        const trackName = tags.title || tags.TITLE;
        const trackNumber = (tags.track || tags.TRACK).match(/^0*(\d+)(\/\d+)?$/)[1];
        const trackID = Models.trackURI(Models.mapTrackToParams({
          name: albumName,
          artist: artistID,
          album: albumID,
          number: trackNumber
        }));
        const fileProps = {
          _id: '',
          artist: artistID,
          album: albumID,
          number: trackNumber,
          path: source,
          bitrate: '' + Math.round(+probed.format.bit_rate / 1000),
          track: trackID,
          duration: probed.format.duration,
          format: ext,
          hash: ''
        };
        const fileID = Models.fileURI(Models.mapFileToParams(fileProps));

        const docs = {
          artist: {
            _id: artistID,
            name: artistName
          },
          album: {
            _id: albumID,
            name: albumName,
            artist: artistID
          },
          track: {
            _id: trackID,
            name: albumName,
            artist: artistID,
            track_artist: tags.artist | tags.ARTIST,
            album: albumID,
            number: trackNumber
          },
          file: Object.assign({}, fileProps, {
            _id: fileID,
            hash: Models.fileURI(fileID).hash
          })
        };

        const databaseOperations = Object.keys(docs).map((model: string) => {
          const props = (docs as any)[model] as any;
          
          const db = new pouchDB(model);
          return db.put(props).catch((err) => {
            if (err.status === 409) return;
            console.log(err);
          });
        });

        await Promise.all(databaseOperations);
        
    }
  }
}
