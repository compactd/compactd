import {IArtist, IAlbum} from 'definitions';

interface AppActionBase {
  type: string;
};

export type AppAction = {};

export type AppActions = {
  action1: (<params>) => void;
}
