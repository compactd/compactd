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

export class Scanner {
  entries: FSTree.FSEntries;
  library: string;
  path: string;
  constructor (library: string) {
    this.library = library;
  }
  async updateLibrary (pouchDB: typeof PouchDB, props: any) {
    const libraries = new pouchDB<Models.Library>('libraries');
    const lib = await libraries.get(this.library);
    await libraries.put(Object.assign({}, lib, props));
  }
  async scan (pouchDB: typeof PouchDB) {
    const libraries = new pouchDB<Models.Library>('libraries');
    const lib = await libraries.get(this.library);

    await this.updateLibrary(pouchDB, {status: 'scanning'});

    this.path = lib.path;
    const timestamp = Date.now();
    this.walkDirectory();

    const patch = await this.getPatch();
    await patch.reduce((acc, entry) => {
      return acc.then(() => this.databaseEntryCreator(pouchDB, entry));
    }, Promise.resolve());

    await this.serializeEntries('/home/vincent/.compactd/');

    await this.updateLibrary(pouchDB, {status: 'ready'});
  }

  walkDirectory () {
    this.entries = walkSync.entries(this.path);
  }

  getSerializedEntries (dir: string): Promise<FSTree.FSEntries> {
    const file = path.join(dir, `fstrees/${this.library}.entries.json`);

    return new Promise<FSTree.FSEntries>((resolve, reject) => {
      if (!existsSync(file)) return resolve([]);
      readFile(file, 'utf8', function (err, content) {
        if (err) return reject (err);

        resolve((JSON.parse(content) as any).entries.map((el: Defs.SerializedFSEntry) => {
          return Object.assign({}, el, {isDirectory: () => el.dir})
        }));
      });
    });
  }

  serializeEntries (dir: string) {
    mkdirp.sync(path.join(dir, 'fstree/libraries'));
    const file = path.join(dir, `fstree/${this.library}.entries.json`);

    return new Promise((resolve, reject) => {
      writeFile(file, JSON.stringify({entries: this.entries.map((el) => {
        return Object.assign({}, el, {dir: el.isDirectory()})
      })}), function (err) {
        if (err) return reject (err);

        resolve();
      });
    });
  }

  async getPatch () {
    const serialized = await this.getSerializedEntries('/home/vincent/.compactd/');
    const staled = FSTree.fromEntries(serialized || []);
    const current = FSTree.fromEntries(this.entries || []);

    return staled.calculatePatch(current);
  }

  ffprobe (file: string){
    const exts = ['.mp4', '.mp3', '.m4a', '.flac', '.ogg', '.wav', '.wmv', '.alac'];
    return new Promise((resolve, reject) => {
      if (!exts.includes(path.extname(file))) {
        return resolve();
      }
      const ffmpeg = Ffmpeg();
      ffmpeg.input(file).ffprobe((err: Error, data: any) => {
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
      case 'mkdir':
        console.log(`Scanning ${file}`);
        return;
      case 'create':
        const source = path.join(this.path, file);

        const probed: any = await this.ffprobe(source);
        if (!probed || !probed.format ||
          !probed.format.tags || !probed.format.tags.title) {
          return;
        }

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
        const trackNumber = (tags.track || tags.TRACK) ?
          (tags.track || tags.TRACK).match(/^0*(\d+)(\/\d+)?$/)[1] : undefined;
        const trackID = Models.trackURI(Models.mapTrackToParams({
          name: trackName,
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
          artists: {
            _id: artistID,
            name: artistName
          },
          albums: {
            _id: albumID,
            name: albumName,
            artist: artistID
          },
          tracks: {
            _id: trackID,
            name: trackName,
            artist: artistID,
            track_artist: tags.artist | tags.ARTIST,
            album: albumID,
            number: trackNumber
          },
          files: Object.assign({}, fileProps, {
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
