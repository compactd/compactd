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
