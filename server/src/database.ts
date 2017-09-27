import Pouch from 'pouchdb';
import * as PouchDBFind from 'pouchdb-find';
import config from './config';

const PouchDB: typeof Pouch = require('pouchdb');

PouchDB.plugin(PouchDBFind);

export default Object.assign(PouchDB.defaults({
  prefix: `http://${config.get('couchUser')}:${config.get('couchPassword')}@${config.get('couchHost')}:${config.get('couchPort')}/`
} as any) as typeof PouchDB, {
  host: `${config.get('couchHost')}:${config.get('couchPort')}`,
  credentials: `${config.get('couchUser')}:${config.get('couchPassword')}`
});

