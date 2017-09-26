import * as keytar from 'keytar';
import Indexer from './';
import {Indexer as IndexerParent} from './Indexer';
import PouchDB from '../../database';
import {Tracker, mapTrackerToParams, trackerURI, DSAlbum} from 'compactd-models';
import RTorrentItem from './rTorrent';
import jwt from '../../jwt';
import httpEventEmitter from '../../http-event';
import {mainStory} from 'storyboard';
import config from '../../config';
import * as path from 'path';
import * as fs from 'fs';
import * as mkdirp from 'mkdirp';

const passwords = path.join(config.get('dataDirectory'), 'credentials');

export async function createTracker (type: string, name: string, username: string) {
  
  const trackers = new PouchDB<Tracker>('trackers');
  const props = {type, name, username};
  const id = trackerURI(mapTrackerToParams(props));

  await trackers.put({_id: id, ...props});

  return await trackers.get(id);
}

function loadPasswords (): Promise<{[id: string]: string}> {

  return new Promise((resolve, reject) => {
    if (!fs.existsSync(passwords)) resolve({});
    return fs.readFile(passwords, (err, data) => {
      if (err) return reject(err);
      resolve(JSON.parse(data.toString()) as any);
    });
  });
}

function writePasswords (data: {[id: string]: string}) {
  return new Promise((resolve, reject) => {
    return fs.writeFile(passwords, JSON.stringify(data), (err) => {
      if (err) reject(err);
      return resolve();
    })
  })
}

async function updatePassword (data: {[id: string]: string}) {
  const pass = await loadPasswords();
  await writePasswords(Object.assign({}, pass, data));
}

/**
 * Store using keytar the password
 * @param id The tracker password id
 * @param password the apssword the username
 */
export async function setPassword (id: string, password: string) {
  const trackers = new PouchDB<Tracker>('trackers');

  const tracker = await trackers.get(id);

  await updatePassword({[tracker._id]: password});

  if (indexers[tracker._id]) {
    await indexers[tracker._id].logout();
  }
}

/**
 * Get user password
 * @param id The tracker password id
 */
export async function getPassword (id: string) {
  const trackers = new PouchDB<Tracker>('trackers');

  const tracker = await trackers.get(id);

  return (await loadPasswords())[tracker._id];

}

export async function listTrackers () {
  const trackers = new PouchDB<Tracker>('trackers');

  const res = await trackers.allDocs({include_docs: true});

  return res.rows.map((r) => r.doc);
}

const indexers: {[id: string]: IndexerParent} = {};

export async function searchTracker (id: string, album: DSAlbum) {
  const trackers = new PouchDB<Tracker>('trackers');

  const tracker = await trackers.get(id);

  const indexer = indexers[tracker._id] = indexers[tracker._id] || new (Indexer(tracker.type))({
    username: tracker.username,
    tracker: tracker.type,
    hostname: tracker.host
  });

  if (!indexer.signedIn) {
    const password = await getPassword(id);
    await indexer.login(password);
  }
  
  return await indexer.searchAlbum(album);
}

const POLLING_INTERVAL = 1000;

export async function downloadFile (id: string, torrent: string) {
  mainStory.info('cascade', `Trying to download from '${id}' torrent id '${torrent}'`);
  const trackers = new PouchDB<Tracker>('trackers');

  const tracker = await trackers.get(id);

  const indexer = indexers[tracker._id] = indexers[tracker._id] || new (Indexer(tracker.type))({
    username: tracker.username,
    tracker: tracker.type,
    hostname: tracker.host
  });

  const buffer = await indexer.downloadRelease(torrent);

  const item = await RTorrentItem.addTorrent(buffer);
  const event = `dl_progress_${item.infoHash}`;
  
  const token = httpEventEmitter.createEventThread(event, async () => {
    const prog = await item.getProgress();
    httpEventEmitter.emit(event, {progress: prog});
    if (httpEventEmitter.listenerCount(event) === 1) {
      const interval: NodeJS.Timer = setInterval(async () => {
        const prog = await item.getProgress();
        httpEventEmitter.emit(event, {progress: prog});
        if (prog === 1) return clearInterval(interval);
      }, POLLING_INTERVAL);
    }
  });

  return {
    ok: true,
    event: token,
    name: item.name
  };
}
