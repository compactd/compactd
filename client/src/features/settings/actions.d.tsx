import {Artist, Album, Tracker, Library} from 'compactd-models';

interface SettingsActionBase {
  type: string;
};

interface ToggleSettingsPage {
  type: 'cassette/settings/TOGGLE_SETTINGS_PAGE';
}

interface ResolveTrackers {
  type: 'cassette/settings/RESOLVE_TRACKERS';
  trackers: Tracker[];
}
interface ResolveLibraries {
  type: 'cassette/settings/RESOLVE_LIBRARIES';
  libraries: Library[];
}
interface SetScanning {
  type: 'cassette/settings/SET_SCANNING';
  scanning: boolean;
}

export type SettingsAction = ToggleSettingsPage | ResolveTrackers | ResolveLibraries | SetScanning;

export type SettingsActions = {
  toggleSettingsPage: (state?: boolean) => void;
  loadTrackers: () => void;
  loadLibraries: () => void;
  editTracker: (id: string, props: Partial<Tracker>) => void;
  editTrackerPassword: (id: string, newPassword: string) => void;
  addTracker: (name: string, type: 'gazelle', username: string, host?: string) => void;
  scan: (id: string) => void;
}
