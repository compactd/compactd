import {IArtist, IAlbum} from '../../definitions/common';

interface ILibraryActionBase {
  type: string;
};

interface IActionResolveArtist {
  type: 'compactd/library/RESOLVE_ARTIST';
  artist: IArtist;
}

interface IActionResolveAlbum {
  type: 'compactd/library/RESOLVE_ALBUM';
  album: IAlbum;
}

export type ILibraryAction = IActionResolveArtist | IActionResolveAlbum;

export type ILibraryActions = {
  fetchArtist: (artist: IArtist) => void;
}
