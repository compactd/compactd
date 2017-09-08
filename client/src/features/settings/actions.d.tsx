import {IArtist, IAlbum} from 'definitions';

interface SettingsActionBase {
  type: string;
};

export type SettingsAction = {};

export type SettingsActions = {
  action1: (<params>) => void;
}
