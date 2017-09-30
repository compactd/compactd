require('source-map-support').install();
const {DevApplication} = require('./dist/DevApplication');
const app = new DevApplication();

app.start();
