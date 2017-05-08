import {Album, Artist} from 'compactd-models';

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

export type LibraryAction = ActionResolveAllAlbums |
                            ActionResolveArtist |
                            ActionResolveAlbum |
                            ActionResolveAllArtists |
                            ActionToggleExpandArtist |
                            ActionResolveCounter;

export type LibraryActions = {
  fetchArtistCounter: (id: string) => void;
  fetchAlbumCounter: (id: string) => void;
  fetchArtist: (artist: string) => void;
  fetchAlbum: (album: string) => void;
  fetchAllArtists: () => void;
  fetchAllAlbums: () => void;
  toggleExpandArtist: () => void;
}
