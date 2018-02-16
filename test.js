const store = require('./server/dist/features/store/');
require('storyboard-preset-console');

(async () => {
  try {

    const id = await store.createStore('gazelle', 'Redacted.ch');
    console.log(id);
    store.putOption(id, 'username', 'eyelama');
    store.putOption(id, 'host', 'redacted.ch');
  } catch (err) {

  }
  console.log(await store.searchStores('Rakoon', 'Our Smiles'));
})().catch(console.log);

