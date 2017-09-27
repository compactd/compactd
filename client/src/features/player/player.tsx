import * as Defs from 'definitions';
import PouchDB from 'pouchdb';
import * as path from 'path';
import {albumURI} from 'compactd-models';
import { PlayerAction, PlayerStack } from './actions.d';
import Toaster from 'app/toaster';

const PLAY_NEXT_ACTION = 'cassette/player/PLAY_NEXT_ACTION';
const PLAY_PREVIOUS_ACTION = 'cassette/player/PLAY_PREVIOUS_ACTION';
const REPLACE_PLAYER_STACK_ACTION = 'cassette/player/REPLACE_PLAYER_STACK_ACTION';
const CLEAR_PLAYLIST_ACTION = 'cassette/player/CLEAR_PLAYLIST_ACTION';
const TOGGLE_PLAYBACK_ACTION = 'cassette/player/TOGGLE_PLAYBACK_ACTION';
const PLAY_AFTER_ACTION = 'cassette/player/PLAY_AFTER_ACTION';
const JUMP_TO = 'cassette/player/JUMP_TO';

const initialState: Defs.PlayerState = {
  playing: false,
  stack: [],
  prevStack: []
};

export function reducer (state: Defs.PlayerState = initialState,
  action: PlayerAction): Defs.PlayerState {
  switch (action.type) {
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
        stack: state.stack.length > 0 ? [state.stack[0], ...action.stack, state.stack.slice(1)]: [...action.stack],
        playing: true,
        prevStack: state.stack[0] ? state.prevStack.concat(state.stack[0]) : state.prevStack
      });
  }
  return state;
}

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

async function playAfter (stack: PlayerStack): Promise<PlayerAction> {
  await Promise.resolve();
  const tracks = new PouchDB<Defs.Track>('tracks');

  if (Array.isArray(stack)) {
    if (stack.length === 2 && Number.isInteger(stack[1] as any)) {
      const [album, index] = stack as [string, number];
      const num = `00${index || 0}`.slice(-2);
      const base = album;
      const docs = await tracks.allDocs({
        include_docs: true,
        startkey: path.join(base, num),
        endkey: path.join(base, '99')
      });
      return {
        type: PLAY_AFTER_ACTION,
        stack: docs.rows.map((row) => row.doc)
      };
    }
    if (typeof stack[0] === 'string') {
      const docs = await Promise.all((stack as string[]).map((id) => {
        return tracks.get(id);
      }));
      return await replacePlayerStack(docs);
    }
    return {
      type: PLAY_AFTER_ACTION,
      stack: stack as Defs.Track[]
    }
  }

  if ((stack as Defs.Track).album) {
    const track = stack as Defs.Track;

    return {
      type: PLAY_AFTER_ACTION,
      stack: [track]
    };
  }
  const album = stack as Defs.Album;

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

async function replacePlayerStack(stack: PlayerStack): Promise<PlayerAction> {
  await Promise.resolve();
  const tracks = new PouchDB<Defs.Track>('tracks');

  if (Array.isArray(stack)) {
    if (stack.length === 2 && Number.isInteger(stack[1] as any)) {
      const [album, index] = stack as [string, number];
      const num = `00${index || 0}`.slice(-2);
      const base = album;
      const docs = await tracks.allDocs({
        include_docs: true,
        startkey: path.join(base, num),
        endkey: path.join(base, '99')
      });
      return {
        type: REPLACE_PLAYER_STACK_ACTION,
        stack: docs.rows.map((row) => row.doc)
      };
    }
    if (typeof stack[0] === 'string') {
      const docs = await Promise.all((stack as string[]).map((id) => {
        return tracks.get(id);
      }));
      return await replacePlayerStack(docs);
    }
    return {
      type: REPLACE_PLAYER_STACK_ACTION,
      stack: stack as Defs.Track[]
    }
  }

  if ((stack as Defs.Track).album) {
    const track = stack as Defs.Track;

    return {
      type: REPLACE_PLAYER_STACK_ACTION,
      stack: [track]
    };
  }
  const album = stack as Defs.Album;

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

export const actions = {
  replacePlayerStack, playNext, playPrevious, togglePlayback, jumpTo, playAfter
}
