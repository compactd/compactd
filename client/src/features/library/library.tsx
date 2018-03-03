import * as Defs from 'definitions';
import { LibraryAction } from './actions.d';
import PouchDB from 'pouchdb';
import {artistURI, albumURI} from 'compactd-models';
import Toaster from 'app/toaster';
import session from 'app/session';
import {getDatabase} from 'app/database';
import { ThunkAction } from 'redux-thunk';
import { CompactdState, Databases } from 'definitions/state';
import { Dispatch } from 'redux';
import LibraryProvider from 'app/LibraryProvider';
import { Artist } from 'definitions';
import { join } from 'path';
import { ActionTypes } from 'features/app';
import * as hash from 'md5';
import { wrapDatabaseFromState } from 'definitions/utils';

const trickle = require('timetrickle');

const RESOLVE_ARTIST = 'compactd/library/RESOLVE_ARTIST';
const RESOLVE_ALL_ARTISTS = 'compactd/library/RESOLVE_ALL_ARTISTS';
const RESOLVE_ALL_TRACKS = 'compactd/library/RESOLVE_ALL_TRACKS';
const RESOLVE_ALL_ALBUMS = 'compactd/library/RESOLVE_ALL_ALBUMS';
const RESOLVE_ALBUM  = 'compactd/library/RESOLVE_ALBUM';
const RESOLVE_TRACK  = 'compactd/library/RESOLVE_TRACK';
const TOGGLE_EXPAND_ARTIST  = 'compactd/library/TOGGLE_EXPAND_ARTIST';
const RESOLVE_COUNTER = 'compactd/library/RESOLVE_COUNTER';
const RESOLVE_RECOMMENDATIONS = 'compactd/library/RESOLVE_RECOMMENDATIONS';
const TOGGLE_HIDDEN = 'cassette/library/TOGGLE_HIDDEN';
const DO_REMOVE = 'cassette/library/DO_REMOVE';
const OFFER_REMOVE = 'cassette/library/OFFER_REMOVE';
const SEARCH_STORE = 'cassette/library/SEARCH_STORE';
const SEARCH_DS_STORE = 'cassette/library/SEARCH_DS_STORE';
const RESOLVE_DOWNLOADS = 'cassette/library/RESOLVE_DOWNLOADS';

const initialState: Defs.LibraryState = {
  albumsById: {},
  artistsById: {},
  tracksById: {},
  albums: [],
  artists: [],
  tracks: [],
  expandArtists: true,
  counters: {},
  topTracks: [],
  resultsById: {},
  dsResultsById: {},
  downloadsByArtist: {},
  databases: {}
};

const getParent = (str: string) => {
  return str.substring(0, str.lastIndexOf('/'));
}

export function reducer (state: Defs.LibraryState = initialState,
  action: any): Defs.LibraryState {
  switch (action.type) {
    case ActionTypes.SET_ORIGIN:
      const prefix = hash(action.origin).substring(0, 6) + '_';
      return {
        ...state,
        origin: action.origin,
        databases: {
          artists: prefix + 'artists',
          albums: prefix + 'albums',
          tracks: prefix + 'tracks',
          downloads: prefix + 'downloads',
          trackers: prefix + 'trackers',
          files: prefix + 'files',
          libraries: prefix + 'libraries',
          stores: prefix + 'stores',
          artworks: prefix + 'artworks',
          origin: action.origin
        }
      }
    case RESOLVE_DOWNLOADS:
      const {downloads} = action;

      return {
        ...state,
        downloadsByArtist: {
          ...state.downloadsByArtist,
          ...(action.downloads.reduce((acc: any, val: any) => {
            return {
              ...acc,
              [val.artist]:
                (acc[val.artist] || []).concat(val,
                  // Nodups
                  (state.downloadsByArtist[val.artist] || []).filter((el) => el._id !== val._id))};
          }, {}))
        }
      }
    case SEARCH_DS_STORE:
      const {artist, results} = action;

      return {
        ...state,
        dsResultsById: {
          ...state.dsResultsById,
          [artist]: results
        }
      }
    case SEARCH_STORE:
      return {
        ...state,
        resultsById: {
          ...state.resultsById,
          [action.album]: action.results
        }
      }
    case DO_REMOVE: {
      const id = action.track;
      const album = getParent(getParent(id));
      
      return {
        ...state,
        albumsById: {
          ...state.albumsById,
          [album]: {
            ...state.albumsById[album],
            tracks: state.albumsById[album].tracks.filter((track) => {
              return track._id !==  id
            }) as any
          }
        }
      }
    }
    case OFFER_REMOVE: {
      const id = action.track;
      const album = getParent(getParent(id));
      
      return {
        ...state,
        albumsById: {
          ...state.albumsById,
          [album]: {
            ...state.albumsById[album],
            tracks: state.albumsById[album].tracks.map((track) => {
              if (track._id === id) {
                return {...track, offerRemove: action.setValue};
              }
              return {...track, offerRemove: false};
            }) as any
          }
        }
      }
    }
    case TOGGLE_HIDDEN: 
      const id = action.track;
      const album = getParent(getParent(id));
      
      return {
        ...state,
        albumsById: {
          ...state.albumsById,
          [album]: {
            ...state.albumsById[album],
            tracks: state.albumsById[album].tracks.map((track) => {
              if (track._id === id) {
                return {...track, hidden: !track.hidden};
              }
              return track
            }) as any
          }
        }
      }
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
    case RESOLVE_ALL_TRACKS:
      return Object.assign({}, state, {
        tracks: action.tracks
      });
    case RESOLVE_ALL_ALBUMS:
      return Object.assign({}, state, {
        albums: action.albums
      });
  }
  return state;
}

function watchDownloads () {
  return (dispatch: Function, getState: () => CompactdState) => {
    getDatabase(getState().app.origin, 'downloads').then((downloads) => {
      downloads.allDocs({include_docs: true}).then(({rows}) => {
        dispatch({
          type: RESOLVE_DOWNLOADS,
          downloads: rows.map(({doc}) => doc)
        });
      });

      downloads.changes({
        live: true,
        since: 'now',
        include_docs: true
      }).on('change', (info) => {
        dispatch({
          type: RESOLVE_DOWNLOADS,
          downloads: [info.doc]
        });
      })
    });
  }
}

const searchDSStore =  wrapDatabaseFromState(function ({origin}, artist: Artist) {
  return session.fetch(origin, '/api/datasource/artists/' + artist.name).then((res) => res.json())
    .then((res: any) => {
      return {
        artist: artist._id,
        type: SEARCH_DS_STORE,
        results: res.topAlbums.filter((album: any) => {
          if (!album.cover) return false;
          if (album.name === '(null)') return false;
          return true;
        })
      }
    }).catch((err) => {
      Toaster.error(err);
    });
});

const searchStore = wrapDatabaseFromState(async function ({origin, artists}, artist: string, album: string) {
  const doc = await new PouchDB<Defs.Artist>(artists).get(artist);
  const res = await session.post(origin, '/api/stores/search', {artist: doc.name, album});
  const {data} = await res.json();

  return {
    type: SEARCH_STORE,
    album: join(artist, album),
    results: data
  }
})


const fetchAlbum = wrapDatabaseFromState(async ({tracks, albums}, album: string) => {

  const Album = new PouchDB<Defs.Album>(albums);
  const Track = new PouchDB<Defs.Track>(tracks);

  const item = await Album.get(album);

  const res = await Track.allDocs({
    include_docs: true,
    startkey: album + '/',
    endkey: album + '/\uffff'
  });
    
  return {
    type: RESOLVE_ALBUM,
    album: Object.assign({}, item, {tracks: res.rows.map(el => el.doc)})
  };
});

const fetchTrack = wrapDatabaseFromState(async ({tracks}, track: string) => {

  const Track = new PouchDB<Defs.Track>(tracks);

  const item = await Track.get(track);
  
  return {
    type: RESOLVE_TRACK,
    track: item
  };
});

function toggleExpandArtist () {
  return {type: TOGGLE_EXPAND_ARTIST};
}

let artistChanges: PouchDB.Core.Changes<{}>[] = null;
let origin: string = null;

function fetchAllArtists () {
  return (dispatch: Dispatch<LibraryAction>, getState: () => CompactdState) =>  {
    const {databases} = getState().app;
    _fetchAllArtists(databases).then(dispatch);
    if (origin !== databases.origin) {
      if (artistChanges) {
        artistChanges.forEach((change) => change.cancel());
      }
      artistChanges = [LibraryProvider.getInstance().onDocAdded(databases.artists, (id) => {
        dispatch({
          type: RESOLVE_ALL_ARTISTS,
          artists: getState().library.artists.concat(id).sort()
        });
      }),
      LibraryProvider.getInstance().onDocRemoved(databases.artists, (id) => {
        dispatch({
          type: RESOLVE_ALL_ARTISTS,
          artists: getState().library.artists.filter((doc) => doc !== id)
        });
      })];
      origin = databases.origin;
    }
  }
}

function _fetchAllArtists (databases: Databases) {
  return Promise.resolve().then(() => {
    const artists = new PouchDB<Defs.Artist>(databases.artists);
    return artists.allDocs({
      include_docs: false,
      startkey: 'library/',
      endkey: 'library/\uffff'
    });
  }).then((docs) => {
    return {
      type: RESOLVE_ALL_ARTISTS,
      artists: docs.rows.map(res => res.id)
    }
  }).catch((err) => {
    Toaster.error(err);
  });
}

let albumChanges: any[] = null, origin2: string = null;

function fetchAllAlbums () {
  return (dispatch: Dispatch<LibraryAction>, getState: () => CompactdState) =>  {
    const {databases} = getState().app;
    _fetchAllAlbums(databases).then(dispatch);
    if (origin2 !== databases.origin) {
      if (albumChanges) {
        albumChanges.forEach((change) => change.cancel());
      }
      albumChanges = [LibraryProvider.getInstance().onDocAdded(databases.albums, (id) => {
        const {artist} = albumURI(id);
        fetchArtist(id)(dispatch, getState);
        dispatch({
          type: RESOLVE_ALL_ALBUMS,
          albums: getState().library.albums.concat(id).sort()
        });
      }),
      LibraryProvider.getInstance().onDocRemoved(databases.albums, (id) => {
        dispatch({
          type: RESOLVE_ALL_ALBUMS,
          albums: getState().library.albums.filter((doc) => doc !== id)
        });
      })]
      origin2 = databases.origin;
    }
  }
}
function _fetchAllAlbums ({albums}: Databases) {
  return Promise.resolve().then(() => {
    return new PouchDB<Defs.Artist>(albums).allDocs({
      include_docs: false,
      startkey: 'library/',
      endkey: 'library/\uffff'
    });
  }).then((docs) => {
    return {
      type: RESOLVE_ALL_ALBUMS,
      albums: docs.rows.map(res => res.id)
    }
  }).catch((err) => {
    Toaster.error(err);
  });
}
const fetchAllTracks = wrapDatabaseFromState(function  ({tracks}) {
  return Promise.resolve().then(() => {
    return new PouchDB<Defs.Track>(tracks).allDocs({include_docs: false});
  }).then((docs) => {
    return {
      type: RESOLVE_ALL_TRACKS,
      tracks: docs.rows.map(res => res.id)
    }
  }).catch((err) => {
    Toaster.error(err);
  });
})

const fetchArtist = wrapDatabaseFromState(async function (databases: Databases, slug: string): Promise<any> {
  if (slug.startsWith('library/')) {
    return await fetchArtist(artistURI(slug).name);
  }
  const Artist = new PouchDB<Defs.Artist>(databases.artists);
  const Album = new PouchDB<Defs.Album>(databases.albums);

  const artist = await Artist.get(artistURI({name: slug}));
  const albums = await Album.allDocs({
    startkey: `library/${slug}/`,
    endkey: `library/${slug}/\uffff`,
    include_docs: false});

  return {
    type: RESOLVE_ARTIST,
    artist: {
      _id: artist._id,
      name: artist.name,
      albums: albums.rows.map((el) => el.id)
    }
  }
})

async function fetchTopTracks ({origin}: Databases) {
  const res = await session.fetch(origin, '/api/reports/tracks/top?limit=30');
  return await res.json();
}

const fetchRecommendations = wrapDatabaseFromState(async function (databases: Databases): Promise<LibraryAction> {
  const topTracks = await fetchTopTracks(databases);
  return {
    type: RESOLVE_RECOMMENDATIONS,
    topTracks
  }
});

const toggleHideTrack = wrapDatabaseFromState(async function ({origin}, trackId: string) {
  
  await session.fetch(origin, '/api/tracks/toggle-hidden', {
    method: 'POST',
    body: JSON.stringify({
      track: trackId
    }),
    headers: {'Content-Type': 'application/json'}
  });
  return {
    type: TOGGLE_HIDDEN,
    track: trackId
  }
});

function doRemove (trackId: string) {
  return async(dispatch: any, getState: () => CompactdState) => {
    const {databases} = getState().app;
    const Track = new PouchDB<Defs.Track>(databases.tracks);
    const track = await Track.get(trackId);

    await session.fetch(getState().app.origin, '/api/tracks/remove', {
      method: 'POST',
      body: JSON.stringify({
        track: trackId
      }),
      headers: {'content-type': 'application/json'}
    });
  
  
    dispatch({
      type: DO_REMOVE,
      track: trackId
    });
    dispatch(await _fetchAllArtists(databases));
    dispatch(await _fetchAllAlbums(databases));

  }
}

function offerRemove (track: string, setValue = true) {
  return {
    type: OFFER_REMOVE, track, setValue
  }
}

function setTrackArtist  (track: string, artist: string, getState: () => CompactdState) {
  return async (dispatch: any) => {

    await session.fetch(getState().app.origin, '/api/tracks/set-artist', {
      method: 'POST',
      body: JSON.stringify({
        track, artist
      }),
      headers: {'content-type': 'application/json'}
    });
  
  
    dispatch(await _fetchAllArtists(getState().app.databases));
    dispatch(await _fetchAllAlbums(getState().app.databases));
  }
}

export const actions = {
  fetchArtist, fetchAllArtists, fetchAllAlbums,
  toggleExpandArtist, fetchAlbum, fetchRecommendations,
  fetchTrack, toggleHideTrack, offerRemove, doRemove,
  setTrackArtist, fetchAllTracks, searchDSStore, searchStore,
  watchDownloads
};
