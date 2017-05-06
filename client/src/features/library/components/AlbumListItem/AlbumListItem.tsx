import * as React from 'react';
import {LibraryActions} from '../../actions.d';

require('./AlbumListItem.scss');

interface AlbumListItemProps {
  actions: LibraryActions;
}

export class AlbumListItem extends React.Component<AlbumListItemProps, {}>{
  render (): JSX.Element {
    const {actions} = this.props;
    return <div className="album-list-item">
    </div>
  }
}