// require('source-map-support').install();
const {ProdApplication} = require('./dist/ProdApplication');
const app = new ProdApplication();

app.start();
