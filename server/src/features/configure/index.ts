import {DetachedDatabaseConfigurator} from './DetachedDatabaseConfigurator';

const configurator = new DetachedDatabaseConfigurator({
  adminPassword: 'password',
  adminUsername: 'admin'
});

configurator.startServer().then(() => configurator.endAdminParty());
