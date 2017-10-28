import Indexer from './';
import {Indexer as IndexerParent} from './Indexer';
import PouchDB from '../../database';
import {Tracker, mapTrackerToParams, trackerURI, DSAlbum} from 'compactd-models';
import {mainStory} from 'storyboard';
import config from '../../config';
import * as path from 'path';
import * as fs from 'fs';
import * as mkdirp from 'mkdirp';
import * as util from 'util';
import {DelugeClient} from 'polytorrent';
import event from '../../http-event';

const passwords = path.join(config.get('dataDirectory'), 'credentials');

const client = new DelugeClient({
  host: config.get('delugeHost'),
  port: config.get('delugePort'),
  password: config.get('delugePassword'),
  log: (level, msg, obj, objLevel = level) => {
    // console.log('deluge', msg, obj);
  }
});

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

const POLLING_INTERVAL = 500;

export async function downloadFile (id: string, torrent: string) {
  mainStory.info('cascade', `Trying to download from '${id}' torrent id '${torrent}'`);
  const trackers = new PouchDB<Tracker>('trackers');
  const downloads = new PouchDB('downloads');

  const tracker = await trackers.get(id);

  const indexer = indexers[tracker._id] = indexers[tracker._id] || new (Indexer(tracker.type))({
    username: tracker.username,
    tracker: tracker.type,
    hostname: tracker.host
  });

  const buffer = await indexer.downloadRelease(torrent);
  
  const temp = path.join(config.get('dataDirectory'), 'temp');

  await util.promisify(mkdirp)(temp, {});

  const download = await client.addFile(buffer, {
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
  });

  watchTorrent([download.hash]);

  return {
    ok: true,
    hash: download.hash,
    name: download.name
  };
}

const DATE_TS_TRESHOLD = 1000 * 60 * 60 * 24;

export async function getDownloads () {

  const downloads = new PouchDB('downloads');
  const res = await downloads.allDocs({include_docs: true});
  const torrents = res.rows.map((doc) => {
    return doc.doc;
  }).filter((doc: any) => {
    if (!doc.done_ts) return true;
    return Date.now() - doc.done_ts < DATE_TS_TRESHOLD;
  });

  return torrents.map((t: any) => ({
    _id: t._id,
    hash: t.hash,
    name: t.name,
    done: t.done
  }));
}

async function watchTorrent (hashes: string[]) {
  const dls = new PouchDB('downloads');
  
  const downloads = await Promise.all(hashes.map(async (hash) => {
    try {

      const t = await client.getTorrent(hash);
      
      return t;
    } catch (err) {
      mainStory.error('deluge', 'Deluge RPC error: ' + err.message);
      return Promise.resolve();
    }
  }));
  
  downloads.forEach((dl) => {
    if (!dl) return;
    dl.removeAllListeners();
    dl.once('finish', async () => {
      event.emit('client_call', {
        method: 'torrentFinished',
        args: [dl.hash, dl.name]
      });
      const doc: any = await dls.get(`downloads/${dl.hash}`);
      await dls.put({
        date: doc.date,
        hash: doc.hash,
        name: doc.name,
        _id: doc._id,
        _rev: doc._rev,
        done: true,
        done_ts: Date.now()
      });

    });
    dl.on('progress', (p) => {
      event.emit('client_call', {
        method: 'torrentProgress',
        args: [dl.hash, p]
      });
    });
    dl.liveFeed(POLLING_INTERVAL);
  });
}

async function watchDownloads () {
  try {

    await client.connect();
  } catch (err) {
    mainStory.error('deluge', 'Deluge RPC error: ' + err.message);
    return;
  }
  const downloads = new PouchDB('downloads');
  const res = await downloads.allDocs({include_docs: true});

  const torrents = res.rows.map((doc) => {
    return doc.doc;
  }).filter((doc: any) => {
    return !doc.done;
  });
  
  watchTorrent(torrents.map((doc: any) => doc.hash)).catch((err) => {
    mainStory.error('deluge', 'Deluge RPC error: ' + err.message);
  });
}

process.nextTick(() => {
  watchDownloads();
});