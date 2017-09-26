import Pouch from 'pouchdb';
const PouchDB: typeof Pouch = require('pouchdb');

export default Object.assign(PouchDB.defaults({
  prefix: `http://admin:password@localhost:5984/`
} as any) as typeof PouchDB, {
  credentials: 'admin:password',
  host: 'localhost:5984'
});

