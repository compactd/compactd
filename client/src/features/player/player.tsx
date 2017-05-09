import * as Defs from 'definitions';
import * as PouchDB from 'pouchdb';
import * as path from 'path';
import {albumURI} from 'compactd-models';
import { PlayerAction, PlayerStack } from './actions.d';

const PLAY_NEXT_ACTION = 'cassette/player/PLAY_NEXT_ACTION';
const PLAY_PREVIOUS_ACTION = 'cassette/player/PLAY_PREVIOUS_ACTION';
const REPLACE_PLAYER_STACK_ACTION = 'cassette/player/REPLACE_PLAYER_STACK_ACTION';
const CLEAR_PLAYLIST_ACTION = 'cassette/player/CLEAR_PLAYLIST_ACTION';
const TOGGLE_PLAYBACK_ACTION = 'cassette/player/TOGGLE_PLAYBACK_ACTION';
const PLAY_AFTER_ACTION = 'cassette/player/PLAY_AFTER_ACTION';

const initialState: Defs.PlayerState = {
  playing: false,
  stack: [],
  prevStack: []
};

export function reducer (state: Defs.PlayerState = initialState,
  action: PlayerAction): Defs.PlayerState {
  switch (action.type) {
    case PLAY_NEXT_ACTION:
    return Object.assign({}, state, {});
    case PLAY_PREVIOUS_ACTION:
      return Object.assign({}, state, {});
    case REPLACE_PLAYER_STACK_ACTION:
      return Object.assign({}, state, {
        stack: action.stack,
        prevStack: state.prevStack.concat(state.stack[0])
      });
    case CLEAR_PLAYLIST_ACTION:
      return Object.assign({}, state, {});
    case TOGGLE_PLAYBACK_ACTION:
      return Object.assign({}, state, {});
    case PLAY_AFTER_ACTION:
      return Object.assign({}, state, {});
  }
  return state;
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
  replacePlayerStack
}
