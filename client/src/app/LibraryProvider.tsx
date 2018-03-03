import PouchDB from 'pouchdb';
import {Album, Track, Artist} from 'compactd-models';
import { Databases } from 'definitions/state';

export type ChangeCallback<T> = (changes: PouchDB.Core.ChangesResponseChange<T>) => void;
export type FeedCallback<T> = (doc: T) => void;
export default class LibraryProvider {
  private cache: {
    [id: string]: Promise<any>
  };
  private feeds: {
    [key: number]: boolean
  };
  private static sInstance = new LibraryProvider();
  private constructor () {
    this.cache = {};
    this.feeds = {};
  }
  async getDocument<T> (db: string, id: string): Promise<T> {
    // if (this.cache[id]) {
    //   return this.cache[id];
    // }
    const doc /*= this.cache[id]*/ = new PouchDB<T>(db).get(id);
    return doc;
  }
  getTrack ({tracks}: Databases, id: string) {
    return this.getDocument<Track>(tracks, id);
  }
  getArtist ({artists}: Databases, id: string) {
    return this.getDocument<Artist>(artists, id);
  }
  getAlbum ({albums}: Databases, id: string) {
    return this.getDocument<Album>(albums, id);
  }
  getAlbumCounters ({tracks}: Databases, id: string) {
    const db = new PouchDB<Artist>(tracks);
    const opts = {
      startkey: id,
      endkey: id + '\uffff'
    };
    return Promise.all([db.allDocs(opts)]).then((docs) => {
      return docs.map((doc) => doc.rows.length);
    });
  }
  getArtistCounters (databases: Databases, id: string) {
    const albums = new PouchDB<Artist>(databases.albums);
    const tracks = new PouchDB<Track>(databases.tracks);
    const opts = {
      startkey: id,
      endkey: id + '\uffff'
    };
    return Promise.all([albums.allDocs(opts), tracks.allDocs(opts)]).then((docs) => {
      return docs.map((doc) => doc.rows.length);
    });
  }
  onDocumentChanged<T>(db: string, id: string, callback: ChangeCallback<T>) {
    const database = new PouchDB<T>(db);
    database.changes({
      since: 'now',
      live: true,
      include_docs: true
    }).setMaxListeners(0).on('change', (val) => {
      if (!id || id === val.id) {
        callback(val);
      }
    });
  }
  cancelFeeds (keys: number[]) {
    if (!keys) return;
    keys.forEach((k) => this.feeds[k] = false);
  }
  liveFeed<T> (db: string, id: string, callback: FeedCallback<T>): number {
    const key = Date.now();
    this.feeds[key] = true;
    this.onDocumentChanged<T>(db, id, (changes) => {
      if (this.feeds[key]) {
        callback(changes.doc);
      }
    })
    this.getDocument<T>(db, id).then((doc) => {
      if (this.feeds[key]) {
        callback(doc);
      }
    }).catch((err) => {
      console.log('couldnt find', db, id);
    });
    return key;
  }
  onDocAdded (db: string, cb: (id: string) => void) {
    return new PouchDB(db).changes({
      since: 'now',
      live: true
    }).on('change', ({changes, id}) => {
      if (changes[0].rev.startsWith('1-')) {
        cb(id);
      }
    });
  }
  onDocRemoved (db: string, cb: (id: string) => void) {
    return new PouchDB(db).changes({
      since: 'now',
      live: true
    }).on('change', ({doc, id, deleted}) => {
      if (deleted) {
        cb(id);
      }
    });
  }
  public static getInstance () {
    return LibraryProvider.sInstance;
  }
}