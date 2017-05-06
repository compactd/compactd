import * as Defs from 'definitions';
import { LibraryAction } from './actions.d';
import * as PouchDB from 'pouchdb';
// import * as IFetch from '@types/whatwg-fetch';
// import "whatwg-fetch";


const RESOLVE_ARTIST = 'compactd/library/RESOLVE_ARTIST';
const RESOLVE_ALL_ARTISTS = 'compactd/library/RESOLVE_ALL_ARTISTS';
const RESOLVE_ALBUM  = 'compactd/library/RESOLVE_ALBUM';

const initialState: Defs.LibraryState = {
  albumsById: {
  },
  artistsById: {
  },
  albums: [],
  artists: [],
  tracks: []
};

export function reducer (state: Defs.LibraryState = initialState,
  action: LibraryAction): Defs.LibraryState {
  switch (action.type) {
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
  }
  return state;
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

function fetchArtist (id: Defs.DatabaseID) {
  return fetch('/api/artist').then((response) => {
    return response.json();
  }).then((artist) => {
    return Promise.resolve({
      type: RESOLVE_ARTIST,
      artist: artist as Defs.Artist
    });
  });
}

export const actions = {
  fetchArtist, fetchAllArtists
};
