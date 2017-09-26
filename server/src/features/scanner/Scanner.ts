import * as Defs from './definitions';
import PouchDB from 'pouchdb';
import * as Database from '../../database';
import * as path from "path";
import { readFile, writeFile, existsSync } from "fs";
import * as mkdirp from 'mkdirp';
import * as events from 'events';

import {mainStory} from 'storyboard';

import config from '../../config';

import Models = require('compactd-models');
import Ffmpeg = require('fluent-ffmpeg');
import FSTree = require('fs-tree-diff');

const walkSync = require('walk-sync');

export class Scanner extends events.EventEmitter {
  entries: FSTree.FSEntries;
  library: string;
  path: string;
  constructor (library: string) {
    super();
    this.library = library;
  }
  async updateLibrary (pouchDB: typeof PouchDB, props: any) {

    const libraries = new pouchDB<Models.Library>('libraries');
    const lib = await libraries.get(this.library);
    await libraries.put(Object.assign({}, lib, props));

    mainStory.debug('scanner', 'Updated library record', {
      attach: { lib, props },
      attachLevel: 'debug'
    });
  }
  async scan (pouchDB: typeof PouchDB) {

    const libraries = new pouchDB<Models.Library>('libraries');
    const lib = await libraries.get(this.library);

    mainStory.debug('scanner', 'Starting scan', {
      attach: {lib}
    });

    await this.updateLibrary(pouchDB, {status: 'scanning'});

    this.path = lib.path;
    const timestamp = Date.now();
    this.walkDirectory();

    const patch = await this.getPatch();
    await patch.reduce((acc, entry) => {
      return acc.then(() => this.databaseEntryCreator(pouchDB, entry));
    }, Promise.resolve());

    await this.serializeEntries(config.get('dataDirectory'));

    await this.updateLibrary(pouchDB, {status: 'ready'});

    this.emit('scan_ended');
  }

  walkDirectory () {
    this.entries = walkSync.entries(this.path);
    mainStory.debug('scanner', `Loaded ${this.entries.length} files to be potentially processed`);
  }

  getSerializedEntries (dir: string): Promise<FSTree.FSEntries> {
    const file = path.join(dir, `fstrees/${path.basename(this.library)}.entries.json`);

    return new Promise<FSTree.FSEntries>((resolve, reject) => {
      if (!existsSync(file)) return resolve([]);
      readFile(file, 'utf8', function (err, content) {
        if (err) return reject (err);
        const entries = (JSON.parse(content) as any).entries;
        mainStory.debug('scanner', `Not processing ${entries.length} entries`);
        resolve(entries.map((el: Defs.SerializedFSEntry) => {
          return Object.assign({}, el, {isDirectory: () => el.dir})
        }));
      });
    });
  }

  serializeEntries (dir: string) {
    mkdirp.sync(path.join(dir, 'fstree/'));
    const file = path.join(dir, `fstree/${path.basename(this.library)}.entries.json`);

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
        mainStory.debug('scanner', `Skipping ${file} (unsupported format)`);
        return resolve();
      }
      mainStory.debug('scanner', `Scanning file ${file}`);
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
        // console.log(`Scanning ${file}`);
        this.emit('open_folder', file);
        mainStory.debug('scanner', `Entering folder ${file}`);
        return;
      case 'create':
        this.emit('open_file', file);
        const source = path.join(this.path, file);
        try {

          const probed: any = await this.ffprobe(source);

          mainStory.debug('scanner', `Probed ${file}`, {
            attach: probed, attachLevel: 'trace'
          })

          if (!probed || !probed.format ||
            !probed.format.tags || (!probed.format.tags.title && !probed.format.tags.TITLE)) {
            mainStory.debug('scanner', `Invalid probed data skipping`);
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
          const disc = (tags.disc || tags.DISC) ?
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
              track_artist: `${tags.artist | tags.ARTIST}`,
              album: albumID,
              number: +trackNumber,
              disc: disc,
              duration: +probed.format.duration
            },
            files: Object.assign({}, fileProps, {
              _id: fileID,
              hash: Models.fileURI(fileID).hash
            })
          };

          mainStory.trace('scanner', `Creating databse documents`, {
            attach: docs, attachLevel: 'trace'
          });

          const databaseOperations = Object.keys(docs).map((model: string) => {
            const props = (docs as any)[model] as any;

            const db = new pouchDB(model);
            return db.put(props).catch((err) => {
              if (err.status === 409) return;
              mainStory.warn('scanner', err.message, {attach: err});
            });
          });

          await Promise.all(databaseOperations);

        } catch (err) {
          mainStory.error('scanner', err.message);
        }
    }
  }
}
