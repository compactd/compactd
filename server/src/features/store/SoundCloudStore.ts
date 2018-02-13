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
        _id: path.join(this._id, 'sets', url.pathname),
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

  fetchResult(sid: string): EventEmitter {
    const eventEmitter = new EventEmitter();
    mainStory.info('store', `Spawning 'soundscrape ${sid}'`);

    const proc = spawn('soundscrape', [sid]);

    proc.stdout.on('data', (data) => console.log(data));
    proc.stderr.on('data', (data) => console.log(data));

    return eventEmitter;
  }

}