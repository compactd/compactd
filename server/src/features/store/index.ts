import PouchDB from '../../database';
import {mainStory} from 'storyboard';
import { join } from 'path';
import HashMap from '../../helpers/HashMap';
import Store from './Store';
import GazelleStore from './GazelleStore';
import SoundCloudStore from './SoundCloudStore';
import * as slug from 'slug';

const STORES = {
  gazelle: GazelleStore,
  soundcloud: SoundCloudStore
}

/**
 * Returns all saved options for a given store as a map
 * @param storeId the store id
 */
export async function getOpts (storeId: string): Promise<HashMap<string>> {
  const conf = new PouchDB('config');

  const {rows} = await conf.allDocs({
    include_docs: true,
    startkey: join('config', storeId, '/'),
    endkey: join('config', storeId, '\uffff')
  });

  return rows.reduce((acc, {doc}) => {
    const {value, key} = doc as any
    return {...acc, [key]: value};
  }, {});
}

/**
 * creates stores for all stores in db
 */
export async function getStores (): Promise<Store[]> {
  const stores = new PouchDB('stores');

  const {rows} = await stores.allDocs({include_docs: true});

  return Promise.all(rows.map(async (store: any) => {
    const matchingStore = (STORES as any)[store.doc.type];
    const opts = await getOpts(store.doc._id);
    
    return new matchingStore(opts, store.doc._id);
  }));
}

export async function getStore (id: string) : Promise<Store>{
  const stores = new PouchDB<any>('stores');
  const store = await stores.get(id);

  const matchingStore = (STORES as any)[store.type];
  const opts = await getOpts(store._id);
  
  return new matchingStore(opts, store._id);
} 

export async function searchStores (artist: string, album: string) {
  const stores = await getStores();

  const res = await Promise.all(stores.map(async (store) => {
    await store.authenticate();
    return {[store.id]: await store.search(artist, album)}
  }));
  
  return res.reduce((acc, val) => ({...acc, ...val}), {});
}

export async function putOption (storeId: string, key: string, value: string) {
  const conf = new PouchDB('config');

  const docId = join('config', storeId, key);
  try {
    const doc = await conf.get(docId);
    await conf.put({
      _id: docId,
      _rev: doc._rev,
      key, value
    });
  } catch (err) {
    await conf.put({
      _id: docId,
      key, value
    });
  }
}

export async function getOption (storeId: string, key: string) {
  const conf = new PouchDB('config');

  const docId = join('config', storeId, key);

  return await conf.get(docId);
}

export async function createStore (type: string, name: string) {
  const stores = new PouchDB('stores');

  const _id = join('stores', type, slug(name, {lower: true}))
  const doc = {type, name, _id};

  await stores.put(doc);

  return _id;
}

export async function downloadResult (storeId: string, result: string) {
  const store = await getStore(storeId);
  await store.authenticate();
  await store.fetchResult(result);

  return {ok: true};
}