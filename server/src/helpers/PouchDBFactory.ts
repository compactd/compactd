import PouchDB from 'pouchdb';
import DepToken from 'shared/constants/DepToken';

PouchDB.plugin(require('pouchdb-adapter-memory'));

export default {
  // inject: [DepToken.DatabaseFactory],
  provide: DepToken.DatabaseFactory,
  useFactory: () => (name: string) => new PouchDB(name, { adapter: 'memory' })
};
