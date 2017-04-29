require('source-map-support').install();
const {DevApplication} = require('./dist/server/src/DevApplication');
const app = new DevApplication();

app.start();
