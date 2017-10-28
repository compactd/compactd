import * as convict from 'convict';
import * as os from 'os';
import * as path from 'path';
import * as shortid from 'shortid';
import * as fs from 'fs';
// const mainStory = require('storyboard').mainStory;

// const story = mainStory.child({
//   src: 'config',
//   title: 'Configuration module',
//   level: 'INFO',
// })

const conf = convict({
  env: {
    doc: "The applicaton environment.",
    format: ["production", "development", "test"],
    default: "production",
    env: "NODE_ENV"
  },
  ip: {
    doc: "The IP address to bind.",
    format: "ipaddress",
    default: "127.0.0.1",
    env: "COMPACTD_IP_ADDRESS",
  },
  port: {
    doc: "The port to bind.",
    format: "port",
    default: 9000,
    env: "COMPACTD_PORT"
  },
  couchPort: {
    doc: 'CouchDB port',
    format: 'port',
    default: 5984,
    env: 'COMPACTD_COUCH_PORT'
  },
  couchHost: {
    doc: 'CouchDB host',
    format: 'ipaddress',
    default: '127.0.0.1',
    env: 'COMPACTD_COUCH_HOST'
  },
  couchUser: {
    doc: 'CouchDB admin user',
    format: '*',
    default: 'admin',
    env: 'COMPACTD_COUCH_USER'
  },
  couchPassword: {
    doc: 'CouchDB admin password',
    format: '*',
    default: '',
    env: 'COMPACTD_COUCH_PASSWORD'
  },
  dataDirectory: {
    doc: "The config root.",
    format: "*",
    default: path.join(os.homedir(), '.compactd/'),
    env: "COMPACTD_DATA_DIR"
  },
  downloadDirectory: {
    doc: "Download directory",
    format: '*',
    default: path.join(os.homedir(), '.compactd/downloads'),
    env: 'COMPACTD_DOWNLOAD_DIR'
  },
  delugePort: {
    doc: "The deluge-web port",
    format: "port",
    default: "8112",
    env: "COMPACTD_DELUGE_PORT"
  },
  delugeHost: {
    doc: "The deluge-web host",
    format: "ipaddress",
    default: "127.0.0.1",
    env: "COMPACTD_DELUGE_HOST"
  },
  delugePassword: {
    doc: "The deluge-web password",
    format: "*",
    default: "deluge",
    env: 'COMPACTD_DELUGE_PASSWORD'
  },
  secret: {
    doc: 'jsonwebtoken secret',
    format: '*',
    default: 'pleaseChangeThisValue',
    env: 'COMPACTD_JWT_SECRET'
  },
  datasource: {
    doc: 'The datasource to use',
    format: (val: string) => ['blitzr', 'lastfm', 'musicbrainz', 'discogs'].includes(val),
    default: 'lastfm',
    env: 'COMPACTD_DATASOURCE'
  },
  datasourceKey: {
    doc: 'The API key',
    format: '*',
    default: '85d5b036c6aa02af4d7216af592e1eea',
    env: 'COMPACTD_DATASOURCE_KEY'
  }
});

// Load environment dependent configuration
var env = conf.get('env');

let paths = [
];

let localConfig = path.join(os.homedir(), '/.compactd/config.json');
if (fs.existsSync(localConfig)) {
  // story.info('config', `loading configuration from '${localConfig}'...`);
  paths.push(localConfig);
}
conf.loadFile(paths);

// Perform validation
conf.validate({allowed: 'strict'} as any);

let props = conf.getProperties();
// story.debug('config', 'resolved configuration is', {
//   attach: Object.assign({}, props, {
//     pthPassword: props['pthPassword'].length > 0 ? '<written out>' : '',
//     jwtSecret: props['jwtSecret'].length > 0 ? '<written out>' : ''
//   })
// });

// story.close();
export default conf;

// const file = path.join(conf.get('configRoot'), 'configured');
// let configured = fs.existsSync(file);

// module.exports.isConfigured = function () {
//   return configured;
// }

// module.exports.markConfigured = function () {
//   configured = true;
//   fs.writeFile(file, 'configured=true', function (attach) {
//     if (attach) {
//       mainStory.warn('config', `Couldn't write file ${file}`, {attach})
//     }
//   });
//   return;$
