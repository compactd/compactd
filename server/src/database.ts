import * as PouchDB from 'pouchdb';

export default PouchDB.defaults({
  prefix: './database/'
} as any);
