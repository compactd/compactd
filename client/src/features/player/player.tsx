import * as Defs from 'definitions';
import PouchDB from 'pouchdb-browser';
import * as path from 'path';
import {albumURI} from 'compactd-models';
import { PlayerAction, PlayerStack, PlayerOptions } from './actions.d';
import MusicContentStore from 'app/content-decorator';
import Toaster from 'app/toaster';
import { Databases, CompactdState } from 'definitions/state';
import { Dispatch } from 'redux';
import { wrapDatabaseFromState } from 'definitions/utils';
import { ActionTypes } from '../app';
import * as hash from 'md5';
import { SetOrigin } from '../app/actions.d';

const PLAY_NEXT_ACTION = 'cassette/player/PLAY_NEXT_ACTION';
const PLAY_PREVIOUS_ACTION = 'cassette/player/PLAY_PREVIOUS_ACTION';
const REPLACE_PLAYER_STACK_ACTION = 'cassette/player/REPLACE_PLAYER_STACK_ACTION';
const CLEAR_PLAYLIST_ACTION = 'cassette/player/CLEAR_PLAYLIST_ACTION';
const TOGGLE_PLAYBACK_ACTION = 'cassette/player/TOGGLE_PLAYBACK_ACTION';
const PLAY_AFTER_ACTION = 'cassette/player/PLAY_AFTER_ACTION';
const JUMP_TO = 'cassette/player/JUMP_TO';

const decorator = new MusicContentStore<Defs.PlayerState>('player');

const initialState: Defs.PlayerState = decorator.initialState({
  playing: false,
  stack: [],
  prevStack: [],
  databases: {},
  origin: null
});

export const reducer = decorator.createReducer(initialState, (state: Defs.PlayerState = initialState,
  action: PlayerAction | SetOrigin): Defs.PlayerState => {
  switch (action.type) {
    case ActionTypes.SET_ORIGIN:
      const {origin} = action as any;
      const prefix = hash(origin).substring(0, 6) + '_';
      return {
        ...state,
        origin: origin,
        databases: {
          artists: prefix + 'artists',
          albums: prefix + 'albums',
          tracks: prefix + 'tracks',
          downloads: prefix + 'downloads',
          trackers: prefix + 'trackers',
          files: prefix + 'files',
          libraries: prefix + 'libraries',
          artworks: prefix + 'artworks',
          origin: origin
        }
      }
    case JUMP_TO:
      const index = action.target;
      return Object.assign({}, state, {
        playing: true,
        prevStack: [].concat(state.prevStack, state.stack[0]),
        stack: state.stack.slice(index)
      });
    case PLAY_NEXT_ACTION:
      return Object.assign({}, state, {
        playing: true,
        prevStack: [].concat(state.prevStack, state.stack[0]),
        stack: state.stack.slice(1)
      });
    case PLAY_PREVIOUS_ACTION:
      return Object.assign({}, state, {
        prevStack: state.prevStack.slice(1),
        playing: true,
        stack: [].concat(state.prevStack[0], state.stack)
      });
    case REPLACE_PLAYER_STACK_ACTION:
      return Object.assign({}, state, {
        stack: action.stack,
        playing: true,
        prevStack: state.stack[0] ? state.prevStack.concat(state.stack[0]) : state.prevStack
      });
    case CLEAR_PLAYLIST_ACTION:
      return Object.assign({}, state, {});
    case TOGGLE_PLAYBACK_ACTION:
      return Object.assign({}, state, {
        playing: !state.playing
      });
    case PLAY_AFTER_ACTION:
      return Object.assign({}, state, {
        stack: state.stack.length > 0 ? [state.stack[0], ...action.stack, ...state.stack.slice(1)]: [...action.stack],
        playing: true,
        prevStack: state.stack[0] ? state.prevStack.concat(state.stack[0]) : state.prevStack
      });
  }
  return state;
})

function togglePlayback () {
  return {
    type: TOGGLE_PLAYBACK_ACTION
  }
}

function playPrevious () {
  return {type: PLAY_PREVIOUS_ACTION}
}

function playNext () {
  return {type: PLAY_NEXT_ACTION}
}

async function _playAfter (databases: Databases, stack: PlayerStack): Promise<PlayerAction> {
  await Promise.resolve();
  const tracks = new PouchDB<Defs.Track>(databases.tracks);
  
  if ((stack as any).albumId) {
    const {albumId, number} = stack as any;
    const base = albumId;
    const docs = await tracks.allDocs({
      include_docs: true,
      startkey: path.join(base, '' + number),
      endkey: path.join(base, '99')
    });
    return {
      type: PLAY_AFTER_ACTION,
      stack: docs.rows.map((row) => row.doc)
    };
  }
  if ((stack as any).trackIds) {
    const docs = await Promise.all((stack as {trackIds: string[]})
      .trackIds.map((id: string) => {
      return tracks.get(id);
    }));
    return await _playAfter(databases, {tracks: docs});
  }
  if ((stack as any).tracks) {
    return {
      type: PLAY_AFTER_ACTION,
      stack: (stack as any).tracks
    }
  }

  if ((stack as any).track) {
    return _playAfter(databases, {tracks: [(stack as any).track]});
  }
  

  const album = (stack as any).album as Defs.Album;

  const docs = await tracks.allDocs({
    include_docs: true,
    startkey: album._id,
    endkey: album._id + '\uffff'
  });

  return {
    type: REPLACE_PLAYER_STACK_ACTION,
    stack: docs.rows.map((row) => row.doc)
  };
  
}

function jumpTo (target: string | number | Defs.Track) {
  return (dispatch: (action: PlayerAction) => void, getState: () => Defs.CompactdState) => {
    const {player} = getState();
    if (typeof target === 'string') {
      return dispatch({
        type: JUMP_TO,
        target: player.stack.findIndex((track) => track._id === target)
      });
    }
    if (typeof target === 'number') {
      return dispatch({
        type: JUMP_TO, target
      })
    }
    if (target._id) {
      return dispatch({
        type: JUMP_TO,
        target: player.stack.findIndex((track) => track._id === target._id)
      });
    }
    return;
  }
}

async function _replacePlayerStack(databases: Databases, stack: PlayerStack, {
  filterHidden = true,
  shuffle = false
}: PlayerOptions = {}): Promise<PlayerAction> {
  await Promise.resolve();
  const tracks = new PouchDB<Defs.Track>(databases.tracks);
  const filterHiddenFunc = (doc: Defs.Track) => {
    return filterHidden ? !doc.hidden : true;
  };
  const possiblyShuffle = (a: Defs.Track, b: Defs.Track) => {
    if (shuffle) return 0.5 - Math.random();
    if (a._id < b._id) {
      return -1;
    }
    if (a._id > b._id) {
      return 1;
    }
    return 0;
  }

  if ('albumId' in stack) {
    const {albumId, number} = stack;
    const base = albumId;
    const docs = await tracks.allDocs({
      include_docs: true,
      startkey: path.join(base, '' + number),
      endkey: path.join(base, '\uffff')
    });
    return {
      type: REPLACE_PLAYER_STACK_ACTION,
      stack: docs.rows.map((row) => row.doc)
        .filter(filterHiddenFunc).sort(possiblyShuffle)
    };
  }
  if ('trackIds' in stack) {
    const docs = await Promise.all((stack)
      .trackIds.map((id: string) => {
      return tracks.get(id);
    }));
    return await _replacePlayerStack(databases, {tracks: docs}, {filterHidden, shuffle});
  }
  if ('tracks' in stack) {
    return {
      type: REPLACE_PLAYER_STACK_ACTION,
      stack: stack.tracks.filter(filterHiddenFunc).sort(possiblyShuffle)
    }
  }

   if ('track' in stack) {
    return _replacePlayerStack(databases, {tracks: [stack.track]});
  }
  
  const album = (stack as any).album as Defs.Album;

  const docs = await tracks.allDocs({
    include_docs: true,
    startkey: album._id,
    endkey: album._id + '\uffff'
  });

  return {
    type: REPLACE_PLAYER_STACK_ACTION,
    stack: docs.rows.map((row) => row.doc).filter(filterHiddenFunc).sort(possiblyShuffle)
  };
}

const replacePlayerStack = wrapDatabaseFromState(_replacePlayerStack);
const playAfter = wrapDatabaseFromState(_playAfter)

export const actions = decorator.addActionsCreators({
  replacePlayerStack, playNext, playPrevious, togglePlayback, jumpTo, playAfter
})
