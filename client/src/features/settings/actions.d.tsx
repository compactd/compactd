import {Artist, Album, Tracker} from 'compactd-models';

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

export type SettingsAction = ToggleSettingsPage | ResolveTrackers;

export type SettingsActions = {
  toggleSettingsPage: (state?: boolean) => void;
  loadTrackers: () => void;
  editTracker: (id: string, props: Partial<Tracker>) => void;
  editTrackerPassword: (id: string, newPassword: string) => void;
  addTracker: (name: string, type: 'gazelle', username: string, host?: string) => void;
}
