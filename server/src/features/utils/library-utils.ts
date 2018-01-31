import PouchDB from '../../database';
import clean from './library-cleaner';
import {
  Track,
  Album,
  File,
  artistURI,
  trackURI,
  fileURI,
  FileParams,
  albumURI,
  mapAlbumToParams,
  mapArtistToParams,
  mapFileToParams,
  mapTrackToParams,
  Artist
} from 'compactd-models'; 
import * as fs from 'fs';
import {Scanner} from '../scanner/Scanner';
import Scheduler from '../scheduler/Scheduler';
import { downloadHQCover } from '../aquarelle/discogfetch';

const files = new PouchDB<File>('files');

function deleteLibraryTree (libraryId: string) {
  return new Promise((resolve, reject) => {
    const scanner = new Scanner(libraryId);
    fs.unlink(scanner.treePath, (err) => {
      // if (err) return reject(err);
      resolve();
    })
  })
}

export async function resetLibrary (libraryId: string) {
  const res = await files.query('files/by_library', {
    startkey: libraryId,
    endkey: libraryId,
    include_docs: true
  });
  
  await Promise.all(res.rows.map(({doc}) => {
    return files.remove(doc._id, doc._rev);
  }));

  await clean(PouchDB, false);

  await deleteLibraryTree(libraryId);
}

const emit: any = Function();

export async function createViews () {
  
  const ddoc = {
    _id: '_design/files',
    views: {
      by_library: {
        map: function (doc: File) {
          emit(doc.library);
        }.toString()
      }
    }
  };
  await files.put(ddoc as any);
}

export async function toggleHideTrack (trackID: string) {
  const Track = new PouchDB<Track>('tracks');

  const track = await Track.get(trackID);

  await Track.put({
    _id: track._id,
    _rev: track._rev,
    name: track.name,
    artist: track.artist,
    album: track.album,
    number: track.number,
    duration: track.duration,
    disc: track.disc,
    hidden: !track.hidden,
  });
}

export async function getRemoveToken (trackID: string) {
  
}
export async function removeTrack (trackID: string) {
  const Track = new PouchDB<Track>('tracks');

  const track = await Track.get(trackID);

  await Track.remove(track._id, track._rev);

  await clean(PouchDB)
}

export async function createArtist (name: string) {
  const _id = artistURI(mapArtistToParams({name}));

  const Artist = new PouchDB<Artist>('artists');
  
  await Artist.put({_id, name});

  await downloadHQCover({_id, name});

  return {_id, name};
}

export async function changeTrackArtist (trackId: string, artistId: string) {
  const Track  = new PouchDB<Track>('tracks');
  const Artist = new PouchDB<Artist>('artists');
  const Album  = new PouchDB<Album>('albums');
  const File = new PouchDB<File>('files');

  const artist = await Artist.get(artistId);
  const track  = await Track.get(trackId);

  if (track.artist === artist._id) {
    return;
  }
  const albumProps = {
    artist: artist._id,
    name: albumURI(track.album).name,
  };

  const props = {
    ...albumProps,
    album: albumURI(mapAlbumToParams(albumProps)),
    number: track.number,
    name: track.name,
  }

  const newTrack: Track = {
    ...props,
    hidden: track.hidden,
    duration: track.duration,
    disc: track.disc,
    _id: trackURI(mapTrackToParams(props as any))
  }

  await Track.remove(track._id, track._rev);

  await Track.put(newTrack);


  // if the album doesnt exist we create it

  const originalAlbum = await Album.get(track.album);

  try {
    const album = await Album.get(newTrack.album);
  } catch (err) {
    const albumProps = {
      artist: newTrack.artist,
      name: originalAlbum.name,
      dateAdded: Date.now()
    }
    const album = {
      _id: albumURI(mapAlbumToParams(albumProps)),
      ...albumProps
    };
    await Album.put(album);
  }

  // Move the files so we can still listen to the music

  const files = await File.allDocs({
    startkey: trackId,
    endkey: trackId + '\uffff',
    include_docs: true
  });

  await Promise.all(files.rows.map(async ({doc: file}) => {
    const props: FileParams = {
      artist: artist._id,
      album: track.album,
      name: track.name,
      number: '' + track.number,
      track: newTrack._id,
      bitrate: '' + file.bitrate,
      hash: '',
      path: file.path
    }
    const newFile: File = {
      ...props,
      _id: fileURI(mapFileToParams(props as any)),
      library: file.library,
      duration: file.duration,
      format: file.format,
      path: file.path
    }
    await File.remove(file._id, file._rev);
    await File.put(newFile);
  }));

  await clean(PouchDB)
}