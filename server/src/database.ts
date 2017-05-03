import * as PouchDB from 'pouchdb';

export default PouchDB.defaults({
  prefix: `http://admin:password@localhost:5984/`
} as any) as typeof PouchDB;
