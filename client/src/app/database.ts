import PouchDB from 'pouchdb';
import session from 'app/session';

(PouchDB as any).adapter('socket', require('socket-pouch/client'));

export const getDatabase = async function<T> (name: string) {
  const res = await session.fetch('/api/database/'+ name);
  const {token, ok} = await res.json();
  return new PouchDB<T>(token, {
    adapter: 'socket',
    url: (window.location.protocol === 'https:' ? 'wss' : 'ws') + '://' + (process.env.NODE_ENV === 'production' ? window.location.host : 'localhost:9001')
  } as any);
}
export const getHttpDatabase = function<T> (name: string) {
  return new PouchDB<T>(`${window.location.origin}/database/${name}`, {
    ajax: {
      cache: true,
      headers: {
        Authorization: 'Bearer ' + session.getToken()
      }
    }
  });
}



function syncDB(local: PouchDB.Database, remote: PouchDB.Database) {
  return new Promise((resolve, reject) => {
    local.sync(remote).on('complete', () => {
      resolve();
    }).on('error', (err) => {
      reject(err);
    });
  });
}

export const syncDatabases = function (...dbs: string[]) {
  return Promise.all(dbs.map((db) => {
    return getDatabase(db).then(syncDB.bind(null, new PouchDB(db)));
  }));
}