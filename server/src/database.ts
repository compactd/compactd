import Pouch from 'pouchdb';
import * as PouchDBFind from 'pouchdb-find';

const PouchDB: typeof Pouch = require('pouchdb');

PouchDB.plugin(PouchDBFind);

export default Object.assign(PouchDB.defaults({
  prefix: `http://admin:password@localhost:5984/`
} as any) as typeof PouchDB, {
  credentials: 'admin:password',
  host: 'localhost:5984'
});

