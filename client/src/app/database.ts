import * as PouchDB from 'pouchdb';

export const getDatabase = function<T> (name: string) {

  return new PouchDB<T>(`${window.location.origin}/database/${name}`, {
    ajax: {
      cache: true,
      headers: {
        'Authorization': `Bearer ${sessionStorage.getItem('session_token')}`
      }
    }
  });
}
