import {DatabaseConfigurator} from './DatabaseConfigurator';
import PouchDB from '../../database';

export async function configure () {
  const configurator = new DatabaseConfigurator({
    adminPassword: 'password',
    adminUsername: 'admin',
    couchHost: 'localhost',
    couchPort: 5984
  });

  await configurator.configure();

}
