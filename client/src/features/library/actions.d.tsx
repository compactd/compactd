import {Album, Artist} from 'compactd-models';

interface LibraryActionBase {
  type: string;
};

interface ActionToggleExpandArtist {
  type: 'compactd/library/TOGGLE_EXPAND_ARTIST';
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
                            ActionToggleExpandArtist;

export type LibraryActions = {
  fetchArtist: (artist: string) => void;
  fetchAlbum: (album: string) => void;
  fetchAllArtists: () => void;
  fetchAllAlbums: () => void;
  toggleExpandArtist: () => void;
}
