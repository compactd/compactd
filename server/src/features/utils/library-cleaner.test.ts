import test from 'ava';
import clean from './library-cleaner';
import Pouch from 'pouchdb';

const PouchDB: typeof Pouch = require('pouchdb').defaults({adapter: 'memory'});

PouchDB.plugin(require('pouchdb-adapter-memory'));

const models = {
  artists: [{
    _id: 'library/foo',
    name: 'Foo'
  }, {
    _id: 'library/bar',
    name: 'Bar'
  }, {
    _id: 'library/flatbush-zombies',
    name: 'Flatbush Zombies'
  }],
  albums: [{
    _id: 'library/flatbush-zombies/betteroffdead',
    name: 'BetterOffDead',
    artist:  'library/flatbush-zombies'
  }, {
    _id: 'library/bar/test',
    name: 'Test',
    artist: 'library/bar'
  }],
  tracks: [{
    _id: 'library/flatbush-zombies/betteroffdead/palm-trees',
    name: 'Palm Trees',
    album: 'library/flatbush-zombies/betteroffdead',
    artist: 'library/flatbush-zombies'
  }],
  files: [{
    _id: 'library/flatbush-zombies/betteroffdead/palm-trees/file',
    name: 'Palm Trees.mp3',
    file: 'library/flatbush-zombies/betteroffdead/palm-trees',
    album: 'library/flatbush-zombies/betteroffdead',
    artist: 'library/flatbush-zombies'
  }]
}

test('should remove only widows', async (t) => {
  const artists = new PouchDB('artists');
  const albums = new PouchDB('albums');
  const tracks = new PouchDB('tracks');
  const files = new PouchDB('files');
  
  await Promise.all(models.artists.map(doc => artists.put(doc)));
  await Promise.all(models.albums.map(doc => albums.put(doc)));
  await Promise.all(models.tracks.map(doc => tracks.put(doc)));
  await Promise.all(models.files.map(doc => files.put(doc)));

  await clean(PouchDB, false);

  t.deepEqual({
    artists: ['library/flatbush-zombies'],
    albums: ['library/flatbush-zombies/betteroffdead'],
    tracks: ['library/flatbush-zombies/betteroffdead/palm-trees']
  }, {
    artists: (await artists.allDocs({})).rows.map((doc) => doc.id),
    albums: (await albums.allDocs()).rows.map((doc) => doc.id),
    tracks: (await tracks.allDocs()).rows.map((doc) => doc.id)
  });
});