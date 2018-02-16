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
import { albumURI, mapAlbumToParams } from "compactd-models/dist";

const HOST = 'https://api-v2.soundcloud.com';

export const optsSchema = [{
  keyName: 'clientId',
  defaultValue: 'a5e78dcad8b4eb32d6f6382bbc3a95ae',
  description: 'SoundCloud API client ID'
}];

export default class SoundCloudStore extends Store {
  
  public name = 'soundcloud';
  
  public constructor (opts: HashMap<string>, id: string) {
    super(optsSchema, opts, id);
  }

  async authenticate(): Promise<void> {
    await this.get('/', {});
  }

  private async get (endpoint: string, opts: any) {
    const params = Object.assign({}, opts,  {
      client_id: this.opts.clientId
    });
    
    const url = urljoin(HOST, endpoint, '?' + qs.stringify(params));

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
        _id: path.join('results', slug(artist), album, url.pathname),
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

  fetchResult(id: string): EventEmitter {
    const eventEmitter = new EventEmitter();
    const [o, artist, album, ...splatSid] = id.split('/');
    const sid = splatSid.join('/');

    const downloads = new PouchDB('downloads');
    const libraries =  new PouchDB('libraries');

    const dlId = path.join('downloads', slug(artist.toLowerCase()), slug(album.toLowerCase()), this.name, sid);
    this.fetchResultName(sid).then((name) => {
      const artistId = path.join('library', slug(artist.toLowerCase()));
      return downloads.put({
        _id: dlId,
        name, sid, artist: artistId, album: albumURI(mapAlbumToParams({name: album, artist: artistId})), store: this.name, date: Date.now(), progress: 0
      });
    }).catch((err) => {
      eventEmitter.emit('error', err);
    });

    libraries.allDocs({include_docs: true, limit: 1}).then(({rows}) => {
      const [doc] = rows;
      const args = [sid, '--path', (doc as any).path];
      mainStory.info('store', `Spawning 'soundscrape ${args.join(' ')}'`);

      const child = spawn('soundscrape', args);

      child.stdout.pipe(process.stdout);
      child.stderr.pipe(process.stderr);

      child.on('exit', (code) => {
        mainStory.info('store', `Received code ${code}`);
        downloads.get(dlId).then((doc) => {
          downloads.put({...doc, progress: 1} as any)
        });
      })
    })
    
    return eventEmitter;
  }

  async fetchResultName (sid: string) {
    const url = urljoin('https://soundcloud.com', sid);

    const res = await fetch(url);
    const text = await res.text();
    const $ = cheerio.load(text, {xmlMode: true});

    const a = $('h1 > a[itemprop="url"]');

    return a.html();
  }

}