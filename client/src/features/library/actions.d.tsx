import {Album, Artist, Track} from 'compactd-models';

interface LibraryActionBase {
  type: string;
};

interface ActionToggleExpandArtist {
  type: 'compactd/library/TOGGLE_EXPAND_ARTIST';
}

interface ActionResolveCounter {
  type: 'compactd/library/RESOLVE_COUNTER';
  id: string;
  tracks: number;
  albums?: number;
}

interface ActionResolveAllArtists {
  type: 'compactd/library/RESOLVE_ALL_ARTISTS';
  artists: Artist[];
}
interface ActionResolveAllTracks {
  type: 'compactd/library/RESOLVE_ALL_TRACKS';
  tracks: Track[];
}

interface ActionResolveAllAlbums {
  type: 'compactd/library/RESOLVE_ALL_ALBUMS';
  albums: Album[];
}

interface ActionResolveArtist {
  type: 'compactd/library/RESOLVE_ARTIST';
  artist: Artist;
}

interface ActionResolveAlbum {
  type: 'compactd/library/RESOLVE_ALBUM';
  album: Album;
}

interface ActionResolveRecommendations {
  type: 'compactd/library/RESOLVE_RECOMMENDATIONS';
  topTracks: {key: string, value: number}[];
}

interface ActionResolveTrack {
  type: 'compactd/library/RESOLVE_TRACK';
  track: Track;
}

interface ToggleHiddenAction {
  type: 'cassette/library/TOGGLE_HIDDEN',
  track: string;
}

interface OfferRemoveAction {
  type: 'cassette/library/OFFER_REMOVE',
  track: string;
  setValue: boolean;
}

interface DoRemoveAction {
  type: 'cassette/library/DO_REMOVE',
  track: string
}

export type LibraryAction =
  ActionResolveAllAlbums |
  ActionResolveAllTracks |
  ActionResolveArtist |
  ActionResolveAlbum |
  ActionResolveAllArtists |
  ActionToggleExpandArtist |
  ActionResolveCounter |
  ActionResolveRecommendations |
  ActionResolveTrack |
  ToggleHiddenAction |
  DoRemoveAction |
  OfferRemoveAction;

export type LibraryActions = {
  fetchArtistCounter: (id: string) => void;
  fetchAlbumCounter: (id: string) => void;
  fetchArtist: (artist: string) => void;
  fetchTrack: (track: string) => void;
  fetchAlbum: (album: string) => void;
  fetchAllArtists: () => void;
  fetchAllAlbums: () => void;
  fetchAllTracks: () => void;
  toggleExpandArtist: () => void;
  toggleHideTrack: (track: string) => void;
  fetchRecommendations: () => void;
  offerRemove: (id: string, setValue?: boolean) => void;
  doRemove: (id: string) => void;
  setTrackArtist: (track: string, artist: string) => void;
}
