import MediaScannerService from '@services/MediaScannerService';

import Album, { IAlbum } from '@models/Album';
import Artist, { IArtist } from '@models/Artist';
import Library from '@models/Library';
import Track, { ITrack } from '@models/Track';

import PouchDB from 'pouchdb';

import { BaseEntity, PouchFactory, SlothDatabase } from 'slothdb';

import Debug from 'debug';
import { join } from 'path';

PouchDB.plugin(require('pouchdb-adapter-memory'));

interface IWithId {
  _id: string;
}

interface ILibraryTree {
  artists: Array<Partial<IArtist> & IWithId>;
  albums: Array<Partial<IAlbum> & IWithId>;
  tracks: Array<Partial<ITrack> & IWithId>;
}
const getDocs = async (
  factory: PouchFactory<any>,
  db: SlothDatabase<any, any, any>
) => {
  return {
    [db._name]: await db
      .findAllDocs(factory, 'library')
      .then(docs => docs.map((doc: BaseEntity<any>) => doc._id))
  };
};
const getTree = async (factory: PouchFactory<any>) => {
  return Object.assign(
    {},
    await getDocs(factory, Artist),
    await getDocs(factory, Album),
    await getDocs(factory, Track)
  );
};

describe('MediaScannerService', () => {
  let mediaScannerService: MediaScannerService;
  let prefix: string;
  let factory: PouchFactory<any>;

  beforeEach(() => {
    mediaScannerService = new MediaScannerService();
    prefix = '_' + Date.now().toString(16) + '__';
    factory = (name: string) =>
      new PouchDB(prefix + name, { adapter: 'memory' });
  });

  test('library-0', async () => {
    const library = await Library.put(factory, {
      name: 'Library 0',
      path: join(__dirname, '../../../samples/library-0')
    });

    await mediaScannerService.runScan(factory, library._id);

    const tree = await getTree(factory);

    expect(tree).toMatchObject({
      albums: [
        'library/alborosie/call-up-jah',
        'library/alborosie/freedom-and-fyah',
        'library/alborosie/soul-pirate'
      ],
      artists: ['library/alborosie'],
      tracks: [
        'library/alborosie/call-up-jah/1-01/call-up-jah',
        'library/alborosie/freedom-and-fyah/1-03/fly-420-feat-sugus',
        'library/alborosie/freedom-and-fyah/1-05/strolling-feat-protoje',
        'library/alborosie/freedom-and-fyah/1-09/life-to-me-feat-ky-mani-marley',
        'library/alborosie/freedom-and-fyah/1-10/rich',
        'library/alborosie/soul-pirate/1-04/kingston-town',
        'library/alborosie/soul-pirate/1-07/herbalist'
      ]
    });
  });
});
