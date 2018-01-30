const pouch = require('pouchdb');


pouch.plugin(require('pouchdb-adapter-memory'));
const PouchDB = pouch.defaults({adapter: 'memory'});

const db1 = new PouchDB('mydb');

(async () => {
  const test = await db1.put({_id: 'foo', foo: 'bar'});
  db1.changes({
    live: true,
    since: 'now',
    include_docs: true
  }).on('change', (changes) => {
    console.log('got changes', new Error().stack);
  }).on('complete', () => {
    console.log('complete', arguments)
  }).on('error', () => {
    console.log('error', arguments)
  }); 
  
  const db2 = new PouchDB('mydb');
  

  await db2.put({
    _id: test.id,
    _rev: test.rev,
    foo: 'barz'
  });

  console.log(await db1.get(test.id));
})()