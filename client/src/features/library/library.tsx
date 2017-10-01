import * as Defs from 'definitions';
import { LibraryAction } from './actions.d';
import PouchDB from 'pouchdb';
import {artistURI} from 'compactd-models';
import Toaster from 'app/toaster';
import session from 'app/session';

const trickle = require('timetrickle');
// import * as IFetch from '@types/whatwg-fetch';
// import "whatwg-fetch";


const RESOLVE_ARTIST = 'compactd/library/RESOLVE_ARTIST';
const RESOLVE_ALL_ARTISTS = 'compactd/library/RESOLVE_ALL_ARTISTS';
const RESOLVE_ALL_ALBUMS = 'compactd/library/RESOLVE_ALL_ALBUMS';
const RESOLVE_ALBUM  = 'compactd/library/RESOLVE_ALBUM';
const RESOLVE_TRACK  = 'compactd/library/RESOLVE_TRACK';
const TOGGLE_EXPAND_ARTIST  = 'compactd/library/TOGGLE_EXPAND_ARTIST';
const RESOLVE_COUNTER = 'compactd/library/RESOLVE_COUNTER';
const RESOLVE_RECOMMENDATIONS = 'compactd/library/RESOLVE_RECOMMENDATIONS';

const initialState: Defs.LibraryState = {
  albumsById: {},
  artistsById: {},
  tracksById: {},
  albums: [],
  artists: [],
  tracks: [],
  expandArtists: true,
  counters: {},
  topTracks: []
};
export function reducer (state: Defs.LibraryState = initialState,
  action: LibraryAction): Defs.LibraryState {
  switch (action.type) {
    case RESOLVE_TRACK:
      return Object.assign({}, state, {
        tracksById: Object.assign({}, state.tracksById, {
          [action.track._id]: action.track
        })
      });
    case RESOLVE_RECOMMENDATIONS:
      return Object.assign({}, state, {
        topTracks: action.topTracks
      });
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

const fetchAlbum = async (album: string) => {

  const Album = new PouchDB<Defs.Album>('albums');
  const Track = new PouchDB<Defs.Track>('tracks');

  const item = await Album.get(album);

  const tracks = await Track.allDocs({
      include_docs: true,
      startkey: album,
      endkey: album + '\uffff'
    })
    
  
  return {
    type: RESOLVE_ALBUM,
    album: Object.assign({}, item, {tracks: tracks.rows.map(el => el.doc)})
  };
};

function waitLimit (limit: any) {
  return new Promise((resolve) => {
    limit(() => resolve());
  });
}

const fetchTrack = async (track: string) => {

  const Track = new PouchDB<Defs.Track>('tracks');

  const item = await Track.get(track);
  
  return {
    type: RESOLVE_TRACK,
    track: item
  };
};

const arlimit = trickle(5, 200);

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
  }).catch((err) => {
    Toaster.error(err);
  });
};

const allimit = trickle(5, 200);

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
  }).catch((err) => {
    Toaster.error(err);
  });;
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
  }).catch((err) => {
    Toaster.error(err);
  });
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
  }).catch((err) => {
    Toaster.error(err);
  });
}

async function fetchArtist (slug: string): Promise<LibraryAction> {
  if (slug.startsWith('library/')) {
    return await fetchArtist(artistURI(slug).name);
  }
  const Artist = new PouchDB<Defs.Artist>('artists');
  const Album = new PouchDB<Defs.Album>('albums');

  const artist = await Artist.get(artistURI({name: slug}));
  const albums = await Album.allDocs({
    startkey: `library/${slug}/`,
    endkey: `library/${slug}/\uffff`,
    include_docs: true});

  return {
    type: RESOLVE_ARTIST,
    artist: {
      _id: artist._id,
      name: artist.name,
      albums: albums.rows.map((el) => el.doc)
    }
  }
}

async function fetchTopTracks () {
  const res = await fetch('/api/reports/tracks/top?limit=30', {
    headers: session.headers()
  });
  return await res.json();
}

async function fetchRecommendations (): Promise<LibraryAction> {
  const topTracks = await fetchTopTracks();
  return {
    type: RESOLVE_RECOMMENDATIONS,
    topTracks
  }
}

export const actions = {
  fetchArtistCounter, fetchAlbumCounter,
  fetchArtist, fetchAllArtists, fetchAllAlbums, toggleExpandArtist, fetchAlbum, fetchRecommendations, fetchTrack
};
