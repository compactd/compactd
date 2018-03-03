import PouchDB from 'pouchdb';
import session from 'app/session';
import {URL} from 'url';

(PouchDB as any).adapter('socket', require('socket-pouch/client'));

export const getDatabase = async function<T> (origin: string, name: string) {
  const res = await session.fetch(origin, '/api/database/'+ name);
  const {token, ok} = await res.json();
  const url = (process.env.NODE_ENV === 'production' ? 'wss://' + new URL(origin).hostname : 'ws://localhost:9001');
  console.log('database url is', url, token);
  return new PouchDB<T>(token, {
    adapter: 'socket',
    url: url
  } as any);
}
export const getHttpDatabase = function<T> (origin: string, name: string) {
  return new PouchDB<T>(`${origin}/database/${name}`, {
    ajax: {
      cache: true,
      headers: {
        Authorization: 'Bearer ' + session.getToken(origin)
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