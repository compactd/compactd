import Store from "./Store";
import fetch from "node-fetch";
import * as qs from "qs";
import * as path from 'path';
import ResultEntry from "./ResultEntry";
import { URL } from "url";
import { spawn } from "child_process";
import { EventEmitter } from "events";
import { mainStory } from "storyboard";
import HashMap from "../../helpers/HashMap";
import * as urljoin from 'url-join';
import * as cheerio from "cheerio";
import PouchDB from '../../database';
import * as slug from 'slug';
import { albumURI, mapAlbumToParams, Artist } from "compactd-models/dist";
import * as assert from 'assert';
import { runInNewContext, runInContext, createContext } from "vm";
import { writeFile } from "fs";
import { promisify } from "util";
import { join } from "path";
import * as PQueue from 'p-queue';
import * as mkdirp from 'mkdirp';
import * as filenamify from 'filenamify';
import { Scanner } from "../scanner/Scanner";

const NodeID3 = require('node-id3');

const V2_HOST = 'https://api-v2.soundcloud.com';
const SITE_HOST = 'https://soundcloud.com';

export const optsSchema = [{
  keyName: 'clientId',
  defaultValue: '', // a5e78dcad8b4eb32d6f6382bbc3a95ae
  description: 'SoundCloud API client ID'
}];

interface TrackProp {id: string, title: string}

export default class SoundCloudStore extends Store {
  
  public name = 'soundcloud';
  
  public constructor (opts: HashMap<string>, id: string) {
    super(optsSchema, opts, id);
  }

  async authenticate(): Promise<void> {
    if (!this.opts.clientId) {
      this.opts.clientId = await this.fetchClientId();
    }
  }

  private async get (endpoint: string, opts: any) {
    const params = Object.assign({}, opts,  {
      client_id: this.opts.clientId
    });
    
    const url = urljoin(V2_HOST, endpoint, '?' + qs.stringify(params));

    mainStory.debug('store', `GET ${url}`);

    const res = await fetch(url);

    if (res.status === 401) {
      throw new Error('API Key is not valid');
    }

    return res.json();
  }

  async search(artist: string, album: string): Promise<ResultEntry[]> {
    
    const {collection} = await this.get('search/albums', {
      q: `${artist} - ${album}`
    });

    return collection.map(({permalink_url, likes_count, title, label_name}: any) => {
      const url = new URL(permalink_url);
      return {
        _id: path.join('results', slug(artist, {lower: true}),  slug(album, {lower: true}), url.pathname),
        name:  title,
        format: 'mp3',
        store: this._id,
        sid: url.pathname,
        stats: [{
          icon: 'heart',
          name: 'Likes',
          desc: 'Number of soundcloud likes',
          value: likes_count
        }]
      }
    });
  }
  
  /**
   * Extract the app.js script from a soundcloud page content
   * This script contains the client_id
   * @param html the html content
   */
  private findAppScriptFromHtml (html: string) {
    const $ = cheerio.load(html);

    const scripts = $('script').filter((index, el) => {
      return /app-\w+-\w+-\d\.js$/.test(el.attribs.src);
    });

    return scripts[0].attribs.src;
  }

  /**
   * Fetches the app.js script URL, in order to fetch the client_id
   */
  private async getAppScriptUrl () {
    const res = await fetch(SITE_HOST);
    const html = await res.text();

    return this.findAppScriptFromHtml(html);
  }

  /**
   * Simply GET an URL and return content as text
   * @param url the target url
   */
  private async fetchText (url: string) {
    const res = await fetch(url);
    return await res.text();
  }

  /**
   * Extract the client id from the app.js script
   * @param str the app.js content
   */
  private extractClientId (str: string) {
    const [match, id] = str.match(/,client_id:"(\w+)"/);

    return id;
  }

  /**
   * Fetches a client_id from soundcloud website
   */
  private async fetchClientId () {

    const appScriptUrl = await this.getAppScriptUrl();

    mainStory.info('store', `App script url found is ${appScriptUrl}`);

    return this.extractClientId(await this.fetchText(appScriptUrl));
  }

  /**
   * Use VM.runInNewContext to parse soundcloud data
   * then return the soundcloud data
   * @param origin the url 
   * @param kind track or playlist
   */
  private async getTrackIds (origin: string, kind: 'track' | 'playlist'): Promise<TrackProp[]> {
    
    const $ = cheerio.load(await this.fetchText(origin));

    const scripts = $('script').filter((index, el) => {
      // The script tags we ant doesn't have any attributes
      return Object.keys(el.attribs).length === 0;
    }).filter(function (index, el) {
      const content = el.children[0].data;
      // And its contents starts with webpackJsonP
      return content && content.startsWith('webpackJsonp');
    });

    assert.equal(scripts.length, 1);
    
    const content = scripts[0].children[0].data;
    const registry: any = {};
    
    // This runs the script and emulate the webpackJsonp function
    // So it assigns data to the registry object
    const context = createContext({
      webpackJsonp: (arr: null, modules: any) => {
        modules[0]({}, null, (id: string) => {
            return Object.assign((data: string) => {
              Object.assign(registry, {[id]: data});
            }, {prototype: {}});
        });
      }
    });

    runInContext(content, context, {
      filename: origin
    });

    // Try to find the right kind of object
    // It should only have one result, so empty has to be empty
    const [wantedKey, ...empty] = Object.keys(registry).filter((key) => {
      const val = registry[key];
      return val.kind === kind;
    });

    assert(empty.length === 0);

    if (kind === 'track') {
      const item = registry[wantedKey];
      return [{
        id: item.id,
        title: item.title
      }];
    }

    // Soundcloud client doesn't resove all ids we need to do it manually
    const unresolvedIds = registry[wantedKey].tracks.filter((el: any) => {
      return !el.title;
    }).map((el: any) => el.id);

    if (unresolvedIds.length > 0) {
      const url = `https://api-v2.soundcloud.com/tracks?ids=${unresolvedIds.join(',')}&client_id=${this.opts.clientId}`;
      const res = await fetch(url);
      mainStory.info('store', 'GET ' + url);
      const tracks = await res.json();

      tracks.forEach((track: any) => {
        const index = registry[wantedKey].tracks.findIndex((el: any) => el.id === track.id);

        registry[wantedKey].tracks[index] = track;
      });
    }

    return registry[wantedKey].tracks.map((el: any) => {
      return {
        id: el.id,
        title: el.title
      }
    });
  }
  /**
   * Write id3tags to mp3 files
   * @param target the target file
   * @param tags tags
   */
  writeId3Tags (target: Buffer, tags: any): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      NodeID3.write(tags, target, function(err: any, buffer: Buffer) { 
        if (err) return reject(err);
        resolve(buffer);
      });
    });
  }
  /**
   * 
   * @param dir Destination directory
   * @param prop the prop of track, id and title to fetch
   * @param tags the tags to add
   */
  async fetchTrack (dir: string, prop: TrackProp, tags: {artist: string, album: string, number?: number}) {
    const url = `https://api.soundcloud.com/i1/tracks/${prop.id}/streams?client_id=${this.opts.clientId}`;
    const res = await fetch(url);

    const {http_mp3_128_url} = await res.json();
    
    const time = Date.now();
    const mp3res = await fetch(http_mp3_128_url);
    const buffer = await mp3res.buffer();

    mainStory.info('store', `GET ${http_mp3_128_url} - ${Date.now() - time}ms`);

    const tagged = await this.writeId3Tags(buffer, {
      title: prop.title,
      artist: tags.artist,
      album: tags.album,
      trackNumber: tags.number
    });

    await promisify(writeFile)(join(dir, filenamify(`${tags.number} - ${prop.title}.mp3`)), tagged);
  }

  fetchResult(id: string): EventEmitter {
    const eventEmitter = new EventEmitter();
    const [o, artist, album, ...splatSid] = id.split('/');
    const sid = splatSid.join('/');

    const downloads = new PouchDB<any>('downloads');
    const libraries =  new PouchDB('libraries');
    const artists =  new PouchDB<Artist>('artists');

    const dlId = path.join('downloads', slug(artist.toLowerCase()), slug(album.toLowerCase()), this.name, sid);

    let resultName: string, dir: string, artistName: string, libraryId: string, dirname: string;

    this.fetchResultName(sid).then((name) => {
      const artistId = path.join('library', slug(artist.toLowerCase()));
      resultName = name;

      return downloads.put({
        _id: dlId,
        name, sid, artist: artistId, album: albumURI(mapAlbumToParams({name: album, artist: artistId})), store: this.name, date: Date.now(), progress: 0
      });
    }).then((doc) => {

      return artists.get('library/' + artist);
    }).then((doc) => {

      artistName = doc.name;
      return libraries.allDocs({include_docs: true, limit: 1});
    }).then(({rows}) => {

      const [{doc}] = rows;
      libraryId = doc._id;
      dirname = filenamify(resultName.startsWith(artistName) ? resultName : artistName + ' - ' + resultName);
      dir = join((doc as any).path, dirname);
      return promisify(mkdirp)(dir, {});
    }).then(() => {
      return this.getTrackIds(urljoin(SITE_HOST, sid), 'playlist');
    }).then((props) => {

      let done = 0;
      mainStory.info('store', 'Tracks props found', {attach: props});

      const fns = props.map((prop, index, arr) => {
        return () => {
          return this.fetchTrack(dir, prop, {
            number: index + 1,
            artist: artistName,
            album: resultName
          }).then(() => {
            return downloads.get(dlId).then((doc) => {
              downloads.put({...doc, progress: (++done) / arr.length});
            });
          }).catch((err) => {
            mainStory.error('store', `Error`, {attach: err});
            eventEmitter.emit('error', err);
            return downloads.get(dlId).then((doc) => {
              downloads.put({...doc, progress: (++done) / arr.length, errors: (doc.errors || 0) + 1});
            });
          });
        }
      });

      return fns.reduce((acc, fn) => {
        return acc.then(fn);
      }, Promise.resolve());
    }).then(() => {
      const scanner = new Scanner(libraryId);
      return scanner.scan(PouchDB, dirname);
    }).catch((err) => {
      mainStory.error('store', `Error for ${urljoin(SITE_HOST, sid)}`, {attach: err});
      eventEmitter.emit('error', err);
    });

    return eventEmitter;
  }

  async fetchResultName (sid: string) {
    const url = urljoin(SITE_HOST, sid);

    const res = await fetch(url);
    const text = await res.text();
    const $ = cheerio.load(text, {xmlMode: true});

    const a = $('h1 > a[itemprop="url"]');
    return a.html();
  }

}