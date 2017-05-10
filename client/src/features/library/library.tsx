import * as Defs from 'definitions';
import { LibraryAction } from './actions.d';
import * as PouchDB from 'pouchdb';
import {artistURI} from 'compactd-models';
const trickle = require('timetrickle');
// import * as IFetch from '@types/whatwg-fetch';
// import "whatwg-fetch";


const RESOLVE_ARTIST = 'compactd/library/RESOLVE_ARTIST';
const RESOLVE_ALL_ARTISTS = 'compactd/library/RESOLVE_ALL_ARTISTS';
const RESOLVE_ALL_ALBUMS = 'compactd/library/RESOLVE_ALL_ALBUMS';
const RESOLVE_ALBUM  = 'compactd/library/RESOLVE_ALBUM';
const TOGGLE_EXPAND_ARTIST  = 'compactd/library/TOGGLE_EXPAND_ARTIST';
const RESOLVE_COUNTER = 'compactd/library/RESOLVE_COUNTER';

const initialState: Defs.LibraryState = {
  albumsById: {
  },
  artistsById: {
  },
  albums: [],
  artists: [],
  tracks: [],
  expandArtists: true,
  counters: {}
};

export function reducer (state: Defs.LibraryState = initialState,
  action: LibraryAction): Defs.LibraryState {
  switch (action.type) {
    case RESOLVE_COUNTER:
      return Object.assign({}, state, {
        counters: Object.assign({}, state.counters, {[action.id]: {
          albums: action.albums,
          tracks: action.tracks
        }})
      })
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

const fetchAlbum = (album: string) => {
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
};

function waitLimit (limit: any) {
  return new Promise((resolve) => {
    limit(() => resolve());
  });
}

const arlimit = trickle(2, 200);

const fetchArtistCounter = (id: string) => {
  return waitLimit(arlimit).then(() => {
    const albums = new PouchDB<Defs.Artist>('albums');
    const tracks = new PouchDB<Defs.Artist>('tracks');
    const opts = {
      startkey: id,
      endkey: id + '\uffff'
    };
    return Promise.all([albums.allDocs(opts), tracks.allDocs(opts)]);
  }).then(([albums, tracks]) => {
    return {
      type: RESOLVE_COUNTER,
      id,
      albums: albums.rows.length,
      tracks: tracks.rows.length
    }
  });
};

const allimit = trickle(3, 180);

function fetchAlbumCounter (id: string) {
  return waitLimit(allimit).then(() => {
    const tracks = new PouchDB<Defs.Artist>('tracks');
    const opts = {
      startkey: id,
      endkey: id + '\uffff'
    };
    return tracks.allDocs(opts);
  }).then((tracks) => {
    return {
      type: RESOLVE_COUNTER,
      id,
      tracks: tracks.rows.length
    }
  });
}

function toggleExpandArtist () {
  return {type: TOGGLE_EXPAND_ARTIST};
}

function fetchAllArtists () {
  return Promise.resolve().then(() => {
    const artists = new PouchDB<Defs.Artist>('artists');
    return artists.allDocs({include_docs: true,
      startkey: 'library/', endkey: 'library/\uffff'});
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
    return albums.allDocs({include_docs: true,
      startkey: 'library/', endkey: 'library/\uffff'});
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
  fetchArtistCounter, fetchAlbumCounter,
  fetchArtist, fetchAllArtists, fetchAllAlbums, toggleExpandArtist, fetchAlbum
};
