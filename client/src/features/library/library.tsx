import * as Defs from 'definitions';
import { LibraryAction } from './actions.d';
import * as PouchDB from 'pouchdb';
import {artistURI} from 'compactd-models';
// import * as IFetch from '@types/whatwg-fetch';
// import "whatwg-fetch";


const RESOLVE_ARTIST = 'compactd/library/RESOLVE_ARTIST';
const RESOLVE_ALL_ARTISTS = 'compactd/library/RESOLVE_ALL_ARTISTS';
const RESOLVE_ALL_ALBUMS = 'compactd/library/RESOLVE_ALL_ALBUMS';
const RESOLVE_ALBUM  = 'compactd/library/RESOLVE_ALBUM';
const TOGGLE_EXPAND_ARTIST  = 'compactd/library/TOGGLE_EXPAND_ARTIST';

const initialState: Defs.LibraryState = {
  albumsById: {
  },
  artistsById: {
  },
  albums: [],
  artists: [],
  tracks: [],
  expandArtists: true
};

export function reducer (state: Defs.LibraryState = initialState,
  action: LibraryAction): Defs.LibraryState {
  switch (action.type) {
    case TOGGLE_EXPAND_ARTIST:
      return Object.assign({}, state, {expandArtists: !state.expandArtists});
    case RESOLVE_ARTIST:
      return Object.assign({}, state, {
        artistsById: {...state.artistsById,
          [action.artist._id]: action.artist
        }
      });
    case RESOLVE_ALBUM:
      return Object.assign({}, state, {
        albumsById: {...state.albumsById,
          [action.album._id]: action.album
        }
      });
    case RESOLVE_ALL_ARTISTS:
      return Object.assign({}, state, {
        artists: action.artists
      });
    case RESOLVE_ALL_ALBUMS:
      return Object.assign({}, state, {
        albums: action.albums
      });
  }
  return state;
}

function fetchAlbum (album: string) {
  return Promise.resolve().then(() => {
    const albums = new PouchDB<Defs.Album>('albums');
    return albums.get(album);
  }).then((doc) => {
    const tracks = new PouchDB<Defs.Track>('tracks');
    return tracks.allDocs({
      include_docs: true,
      startkey: album,
      endkey: album + '\uffff'
    }).then((docs) => [doc, docs]);
  }).then(([album, tracks]:
    [Defs.Album, PouchDB.Core.AllDocsResponse<Defs.Track>]) => {
    return {
      type: RESOLVE_ALBUM,
      album: Object.assign({}, album, {tracks: tracks.rows.map(el => el.doc)})
    };
  });
}

function toggleExpandArtist () {
  return {type: TOGGLE_EXPAND_ARTIST};
}

function fetchAllArtists () {
  return Promise.resolve().then(() => {
    const artists = new PouchDB<Defs.Artist>('artists');
    return artists.allDocs({include_docs: true});
  }).then((docs) => {
    return {
      type: RESOLVE_ALL_ARTISTS,
      artists: docs.rows.map(res => res.doc)
    }
  })
}

function fetchAllAlbums () {
  return Promise.resolve().then(() => {
    const albums = new PouchDB<Defs.Artist>('albums');
    return albums.allDocs({include_docs: true});
  }).then((docs) => {
    return {
      type: RESOLVE_ALL_ALBUMS,
      albums: docs.rows.map(res => res.doc)
    }
  })
}

function fetchArtist (slug: string) {
  return Promise.resolve().then(() => {
    const artists = new PouchDB<Defs.Artist>('artists');
    return artists.get(artistURI({name: slug}));
  }).then((doc) => {
    const albums = new PouchDB<Defs.Album>('albums');
    return albums.allDocs({
      startkey: `library/${slug}/`,
      endkey: `library/${slug}/\uffff`,
      include_docs: true}).then((docs) => [doc, docs]);
  }).then(([artist, docs]:
    [Defs.Artist, PouchDB.Core.AllDocsResponse<Defs.Album>]) => {

    return {
      type: RESOLVE_ARTIST,
      artist: {
        _id: artist._id,
        name: artist.name,
        albums: docs.rows.map((el) => el.doc)
      }
    }
  })
}

export const actions = {
  fetchArtist, fetchAllArtists, fetchAllAlbums, toggleExpandArtist, fetchAlbum
};
