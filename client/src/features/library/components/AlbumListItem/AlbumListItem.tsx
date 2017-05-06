import * as React from 'react';
import {LibraryActions} from '../../actions.d';
import {Album, albumURI} from 'compactd-models';
import {Link} from 'react-router-dom';
require('./AlbumListItem.scss');

interface AlbumListItemProps {
  actions: LibraryActions;
  album: Album;
}

export class AlbumListItem extends React.Component<AlbumListItemProps, {}>{
  render (): JSX.Element {
    const {actions, album} = this.props;
    return <div className="album-list-item">
      <Link to={`/library/${albumURI(album._id).name}`}>
        <div className="album-image">
          <img src="http://placehold.it/64x64" />
        </div>
        <div className="album-description">
          <span className="album-name">
            {album.name}
          </span>
          <span className="album-track-count">15 albums</span>
        </div>
      </Link>
    </div>
  }
}
