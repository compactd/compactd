import PouchDB from 'pouchdb';
import {File, Track, Album, Artist} from 'compactd-models';
import {mainStory} from 'storyboard';

async function getIDs<T> (pouch: typeof PouchDB, db: string): Promise<[PouchDB.Database<T>, {id: string, rev: string}[]]> {
  const data = new pouch<T>(db);
  const res = await data.allDocs({include_docs: false});
  
  const ids =  res.rows.map((doc) => ({id: doc.id, rev: doc.value.rev}));
  return [data, ids];
}

export default async function (pouch: typeof PouchDB, dryRun = false) {
  const [files, filesId]   = await getIDs(pouch, 'files');
  const [tracks, tracksId]  = await getIDs(pouch, 'tracks');

  const widowTracks = tracksId.filter((track) => {
    return !filesId.find((file) => file.id.startsWith(track.id));
  });

  mainStory.debug('vacuum', `Removing ${widowTracks.length} tracks`, {
    attach: widowTracks, attachLevel: 'trace'});

  if (!dryRun) {
    await Promise.all(widowTracks.map((doc) => {
      return tracks.remove(doc.id, doc.rev);
    }));
  }

  const [albums, albumsId]  = await getIDs(pouch, 'albums');

  const widowAlbums = albumsId.filter((album) => {
    return !tracksId.find((track) => track.id.startsWith(album.id));
  });

  mainStory.debug('vacuum', `Removing ${widowTracks.length} albums`, {
    attach: widowAlbums, attachLevel: 'trace'});

  if (!dryRun) {
    await Promise.all(widowAlbums.map((doc) => {
      return albums.remove(doc.id, doc.rev).then(() => {
        console.log('remvoved', doc);
        
      });
    }));
  }


  const [artists, artistsId] = await getIDs(pouch, 'artists');
  console.log(artistsId, albumsId);
  
  const widowArtists = artistsId.filter((artist) => {
    return !albumsId.find((album) => album.id.startsWith(artist.id));
  });

  mainStory.debug('vacuum', `Removing ${widowTracks.length} artists`, {
    attach: widowArtists, attachLevel: 'trace'});

  
  if (!dryRun) {
    await Promise.all(widowArtists.map((doc) => {
      return artists.remove(doc.id, doc.rev);
    }));
  }
}