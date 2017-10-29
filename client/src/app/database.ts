import PouchDB from 'pouchdb';
import Session from 'app/session';

export const getDatabase = function<T> (name: string) {

  return new PouchDB<T>(`${window.location.origin}/database/${name}`, {
    ajax: {
      cache: true,
      headers: Session.headers()
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
    return syncDB(new PouchDB(db), getDatabase(db));
  }));
}