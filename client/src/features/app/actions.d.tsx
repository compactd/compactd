import {Artist, Album} from 'definitions';
import { ActionTypes } from 'features/app';

interface AppActionBase {
  type: string;
};

interface ResolveStateAction {
  type: 'compactd/app/RESOLVE_STATE',
  configured: boolean,
  user?: string
}

interface SetUserAction {
  type: 'compactd/app/SET_USER',
  user: string,
  token: string
}

interface StartSyncAction {
  type: 'compactd/app/START_SYNC';
}

interface UpdateSyncAction {
  type: 'compactd/app/UPDATE_SYNC';
  progress: number;
}

interface EndSyncAction {
  type: 'compactd/app/END_SYNC'
}
export interface SetOrigin {
  type: ActionTypes.SET_ORIGIN,
  origin: string;
}

export type AppAction = SetUserAction | ResolveStateAction | StartSyncAction
  | UpdateSyncAction | EndSyncAction | SetOrigin;

export type AppActions = {
  fetchState: () => void;
  login: (username: string, password: string) => void;
  sync: (origin: string) => void;
}
