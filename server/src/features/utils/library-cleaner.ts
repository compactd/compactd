import * as PouchDB from 'pouchdb';
import {File, Track, Album, Artist} from 'compactd-models';
import {mainStory} from 'storyboard';

async function getIDs<T> (pouch: typeof PouchDB, db: string): Promise<[PouchDB.Database<T>, {id: string, rev: string}[]]> {
  const data = new pouch<T>(db);
  const res = await data.allDocs({include_docs: false});
  
  const ids =  res.rows.map((doc) => ({id: doc.id, rev: doc.value.rev}));
  return [data, ids];
}

function tryRemoveArtwork(pouch: typeof PouchDB, id: string) {
  return async () => {
    const artworks = new pouch('artworks');
    
    try {
      const doc = await artworks.get('artworks/' + id);
      await artworks.remove(doc);
    } catch (ignored) {}
  }
}

export default async function clean (pouch: typeof PouchDB, dryRun = false) {
  let didSomething = false;

  const [files, filesId]   = await getIDs(pouch, 'files');
  const [tracks, tracksId]  = await getIDs(pouch, 'tracks');


  const widowTracks = tracksId.filter((track) => {
    return !filesId.find((file) => file.id.startsWith(`${track.id}/`));
  });

  mainStory.debug('vacuum', `Removing ${widowTracks.length} tracks`, {
    attach: widowTracks, attachLevel: 'debug'});

  if (widowTracks.length) didSomething = true;

  if (!dryRun) {
    await Promise.all(widowTracks.map((doc) => {
      return tracks.remove(doc.id, doc.rev);
    }));
  }

  const [albums, albumsId]  = await getIDs(pouch, 'albums');

  const widowAlbums = albumsId.filter((album) => {
    return !tracksId.find((track) => track.id.startsWith(`${album.id}/`))
    // || widowTracks.find((track) => track.id.startsWith(`${album.id}/`));
  });

  if (widowAlbums.length) didSomething = true;

  mainStory.debug('vacuum', `Removing ${widowAlbums.length} albums`, {
    attach: widowAlbums, attachLevel: 'debug'});

  if (!dryRun) {
    await Promise.all(widowAlbums.map((doc) => {
      return albums.remove(doc.id, doc.rev).then(tryRemoveArtwork(pouch, doc.id));
    }));
  }


  const [artists, artistsId] = await getIDs(pouch, 'artists');

  const widowArtists = artistsId.filter((artist) => {
    return !albumsId.find((album) => album.id.startsWith(`${artist.id}/`))
      // || widowAlbums.find((album) => album.id.startsWith(`${artist.id}/`));
  });

  if (widowArtists.length) didSomething = true;

  mainStory.debug('vacuum', `Removing ${widowArtists.length} artists`, {
    attach: widowArtists, attachLevel: 'debug'});

  
  if (!dryRun) {
    await Promise.all(widowArtists.map((doc) => {
      return artists.remove(doc.id, doc.rev).then(tryRemoveArtwork(pouch, doc.id));
    }));
  }
  if (didSomething) {
    await clean(pouch, dryRun);
  }
}