import * as React from 'react';
import {LibraryActions} from '../../actions.d';
import {Artist} from 'compactd-models';

require('./ArtistListItem.scss');

interface ArtistListItemProps {
  actions: LibraryActions;
  artist: Artist;
}

export class ArtistListItem extends React.Component<ArtistListItemProps, {}>{
  render (): JSX.Element {
    const {actions, artist} = this.props;
    return <div className="artist-list-item">
      <div className="artist-image">
        <img src="http://placehold.it/64x64" />
      </div>
      <div className="artist-description">
        <span className="artist-name">{artist.name}</span>
        <span className="artist-album-count">15 albums</span>
      </div>
    </div>
  }
}
