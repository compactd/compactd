import * as React from 'react';
import {LibraryActions} from '../../actions.d';

require('./ArtistListItem.scss');

interface ArtistListItemProps {
  actions: LibraryActions;
}

export class ArtistListItem extends React.Component<ArtistListItemProps, {}>{
  render (): JSX.Element {
    const {actions} = this.props;
    return <div className="artist-list-item">
    </div>
  }
}