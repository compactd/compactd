import * as keytar from 'keytar';
import Indexer from './';
import {Indexer as IndexerParent} from './Indexer';
import PouchDB from '../../database';
import {Tracker, mapTrackerToParams, trackerURI, DSAlbum} from 'compactd-models';

export async function createTracker (type: string, name: string, username: string) {
  const trackers = new PouchDB<Tracker>('trackers');
  const props = {type, name, username};
  const id = trackerURI(mapTrackerToParams(props));

  await trackers.put({_id: id, ...props});

  return await trackers.get(id);
}

/**
 * Store using keytar the password
 * @param id The tracker password id
 * @param password the apssword the username
 */
export async function setPassword (id: string, password: string) {
  const trackers = new PouchDB<Tracker>('trackers');

  const tracker = await trackers.get(id);

  await keytar.setPassword(tracker._id, tracker.username, password);

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

  return await keytar.getPassword(tracker._id, tracker.username);

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