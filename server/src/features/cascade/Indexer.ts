import {DSAlbum, Release} from 'compactd-models';

const trickle = require('timetrickle');

export interface IndexerConfig {
  hostname: string;
  protocol: 'http' | 'https';
  port: number;
  endpoint: string;
  username: string;
  tracker: string;
  rateLimits?: {
    frame: number;
    calls: number;
  }
}

export interface PartialIndexerConfig {
  hostname?: string;
  protocol?: 'http' | 'https';
  port?: number;
  endpoint?: string;
  username: string;
  tracker: string;
  rateLimits?: {
    frame: number;
    calls: number;
  }
}

export abstract class Indexer implements IndexerConfig{
  hostname: '';
  protocol: 'https';
  port: 443;
  endpoint: '';
  username: '';
  tracker: '';
  rateLimits: {
    frame: 1;
    calls: 100;
  }
  signedIn: boolean;
  limit = () => Promise.resolve({});
  constructor (config: IndexerConfig) {
    Object.assign(this, config);
    
    const limit = trickle(this.rateLimits.calls, this.rateLimits.frame);
    this.limit = () => new Promise((resolve) => {
      limit(() => resolve());
    });
  }
  ensureLoggedIn (): Promise<void> {
    if (!this.signedIn) return Promise.reject('Not logged in to use indexer');
    return Promise.resolve();
  }
  abstract login (password: string): Promise<void>;
  abstract searchAlbum (album: DSAlbum): Promise<Release[]>;
  abstract downloadRelease (torrent_id: string): Promise<Buffer>;
}