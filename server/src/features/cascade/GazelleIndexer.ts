import {Indexer, IndexerConfig, PartialIndexerConfig} from './Indexer';
import { Release, DSAlbum } from "compactd-models";
import fetch from 'node-fetch';
import * as qs from 'querystring';
import {mainStory} from 'storyboard';
import {GazelleResponse, GazelleGroup} from './GazelleAPI';

const defaultOptions: IndexerConfig = {
  hostname: 'redacted.ch',
  username: '',
  protocol: 'https',
  port: 443,
  tracker: '',
  endpoint: 'ajax.php',
  rateLimits: {
    frame: 10*1000,
    calls: 5
  }
}

export class GazelleIndexer extends Indexer {
  sessionCookie: string = '';
  constructor (config: PartialIndexerConfig) {
    super(Object.assign({}, defaultOptions, config));
  }
  logout(): Promise<void> {
    this.sessionCookie = '';
    this.signedIn = false;
    return Promise.resolve();
  }
  async login(password: string): Promise<void> {
    if (this.signedIn) {
      return Promise.resolve();
    } else {
      mainStory.info('cascade', `Trying to logging you in as ${this.username}...`);

      let url = `${this.protocol}://${this.hostname}:${this.port}/login.php`;

      const time = Date.now();

      const res = await fetch(url, {
        method: 'POST',
        redirect: 'manual',
        body: qs.stringify({
          username: this.username, 
          password: password,
          keeplogged: 1
        }),
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        }
      });

      mainStory.debug('cascade', `POST ${url} - ${time - Date.now()} ms`, {
        attach: res.timeout,
        attachLevel: 'trace'
      });

      if (res.status === 302) {
        const setCookie  = res.headers.get('Set-Cookie');
        const cookie: any = setCookie.split(';').map(st => st.trim().split('=')).reduce((acc, val) => {
          return Object.assign({}, acc, {
            [val[0]]: val[1] || true
          });
        }, {});

        this.sessionCookie = cookie.session;
        this.signedIn = true;
        return;
      }
      
      throw new Error('Wrong username or password');
    }
  }
  async call<E> (method: string, args: {[key: string]: string | number | boolean}, endpoint = this.endpoint): Promise<GazelleResponse<E>> {
    if (!this.signedIn) throw new Error('Please login before using API');

    await this.limit();

    const query = qs.stringify(Object.assign({}, {
      action: method
    }, args));

    const url = `${this.protocol}://${this.hostname}:${this.port}/${this.endpoint}?${query}`;
    
    const time = Date.now();

    const res = await fetch (url, {
      headers: {
        'Cookie': `session=${this.sessionCookie}`
      }
    });

    mainStory.info('cascade', `GET ${url} - ${res.status} - ${time - Date.now()} ms`, {
      attach: res,
      attachLevel: 'trace'
    });

    return await res.json();
  }
  async searchAlbum(album: DSAlbum): Promise<Release[]> {
    const res = await this.call<GazelleGroup>('browse', {
      searchstr: '',
      artistname: album.artist,
      groupname: album.name
    });

    const {results} = res.response;
    
    return results.reduce((acc: Release[], group) => {
      const torrents: Release[] = group.torrents.map((t): Release => {
        return {
          torrent_id: '' + t.torrentId,
          tracker: this.tracker,
          seeders: t.seeders,
          leechers: t.leechers,
          score: t.seeders * t.seeders / (t.leechers + 1),
          format: t.format.toLowerCase(),
          bitrate: 0,
          _id: '',
          wanted: '',
          name: `${group.artist} - ${group.groupName} - ${group.groupYear} (${t.media} - ${t.format} ${t.encoding})`
        } as any;
      })
      return [].concat(acc, ...torrents);
    }, []);
  }
  async downloadRelease(torrent_id: string): Promise<Buffer> {
    throw new Error("Method not implemented.");
  }

}