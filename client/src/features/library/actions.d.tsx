import {Album, Artist} from 'compactd-models';

interface LibraryActionBase {
  type: string;
};

interface ActionResolveAllArtists {
  type: 'compactd/library/RESOLVE_ALL_ARTISTS';
  artists: Artist[];
}

interface ActionResolveArtist {
  type: 'compactd/library/RESOLVE_ARTIST';
  artist: Artist;
}

interface ActionResolveAlbum {
  type: 'compactd/library/RESOLVE_ALBUM';
  album: Album;
}

export type LibraryAction = ActionResolveArtist | ActionResolveAlbum | ActionResolveAllArtists;

export type LibraryActions = {
  fetchArtist: (artist: Artist) => void;
  fetchAllArtists: () => void;
}
