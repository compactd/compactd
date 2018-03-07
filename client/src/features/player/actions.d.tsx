import {Artist, Album, Track} from 'definitions';
import { MusicContentAction, ActionCreators } from 'app/content-decorator';
import { ActionTypes } from 'features/app';

interface PlayerActionBase {
  type: string;
};

interface PrepareTrackAction {
  type: 'cassette/player/PREPARE_TRACK_ACTION',
  token: string,
  track: string,
  artist: Artist,
  album: Album
}

interface PlayNextAction {
  type: 'cassette/player/PLAY_NEXT_ACTION';
}

interface PlayPreviousAction {
  type: 'cassette/player/PLAY_PREVIOUS_ACTION';
}

interface ReplacePlayerStackAction {
  type: 'cassette/player/REPLACE_PLAYER_STACK_ACTION';
  stack: Track[];
}

interface ClearPlaylistAction {
  type: 'cassette/player/CLEAR_PLAYLIST_ACTION';
}

interface TogglePlaybackAction {
  type: 'cassette/player/TOGGLE_PLAYBACK_ACTION';
}

interface PlayAfterAction {
  type: 'cassette/player/PLAY_AFTER_ACTION';
  stack: Track[];
}

interface JumpToAction {
  type: 'cassette/player/JUMP_TO',
  target: number;
}


export type PlayerAction =  PlayNextAction |
                            PlayPreviousAction |
                            ReplacePlayerStackAction |
                            ClearPlaylistAction |
                            TogglePlaybackAction |
                            JumpToAction |
                            PlayAfterAction |
                            PlayNextAction | {type: ActionTypes.RESET_APP}

// Album | [Album, number] | Track[] | Track

export type PlayerStack = {
  album: Album;
} | {
  albumId: string;
  number: number;
} | {
  tracks: Track[]
} | {
  track: Track
} | {
  trackIds: string[]
};

export type PlayerOptions = {
  filterHidden?: boolean;
  shuffle?: boolean;
}


export type PlayerActions = {
  playNext: (index?: number) => void;
  playPrevious: () => void;
  replacePlayerStack: (stack: PlayerStack, opts?: PlayerOptions) => void;
  clearPlaylist: () => void;
  togglePlayback: () => void;
  playAfter: (stack: PlayerStack) => void;
  jumpTo: (target: Track | number | string) => void;
} & ActionCreators;
