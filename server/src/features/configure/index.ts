import {DatabaseConfigurator} from './DatabaseConfigurator';
import PouchDB from '../../database';
import config from '../../config';

export async function configure () {
  const configurator = new DatabaseConfigurator({
    adminPassword: config.get('couchPassword'),
    adminUsername: config.get('couchUser'),
    couchHost: config.get('couchHost'),
    couchPort: config.get('couchPort')
  });

  await configurator.configure();

}
