import DepToken from '@constants/DepToken';
import PouchDB from 'pouchdb';

PouchDB.plugin(require('pouchdb-adapter-memory'));

export default {
  // inject: [DepToken.DatabaseFactory],
  provide: DepToken.DatabaseFactory,
  useFactory: () => (name: string) => new PouchDB(name, { adapter: 'memory' })
};
