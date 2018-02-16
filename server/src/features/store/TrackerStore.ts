import Store from "./Store";
import StoreOptionsSchema from './StoreOptionsSchema';
import PouchDB from '../../database';
import * as path from 'path';
import * as fs from 'fs';
import * as mkdirp from 'mkdirp';
import * as util from 'util';
import {mainStory} from 'storyboard';
import config from '../../config';
import { DelugeClient } from "polytorrent";
import { EventEmitter } from "events";

const POLLING_INTERVAL = 1000;

export default abstract class TrackerStore extends Store {
  protected client: DelugeClient;

  async authenticate () {
    this.client = new DelugeClient({
      password: this.opts['password'],
      host:  this.opts['host'],
      port: +this.opts['port']
    });
  }

  protected async downloadFile (buffer: Buffer, eventEmitter: EventEmitter, resId?: string) {
    await this.client.connect();
    
    const downloads = new PouchDB('downloads');

    const temp = path.join(config.get('dataDirectory'), 'temp');

    await util.promisify(mkdirp)(temp, {});

    const download = await this.client.addFile(buffer, {
      tempDirectory: temp,
      directory: config.get('downloadDirectory')
    });

    await download.update();

    await downloads.put({
      _id: `downloads/${download.hash}`,
      date: Date.now(),
      name: download.name,
      hash: download.hash,
      done: download.progress === 1,
      res_id: resId
    });

    
    const dl = await this.client.getTorrent(download.hash);

    dl.removeAllListeners();

    dl.once('finish', async () => {
      eventEmitter.emit('finish', {});
    });

    dl.on('progress', (progress) => {
      eventEmitter.emit('finish', {progress});
    })

    dl.liveFeed(POLLING_INTERVAL);
  }
}