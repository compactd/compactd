import * as React from 'react';
import {LibraryActions} from '../../actions.d';
import {Album, albumURI} from 'compactd-models';
import {Link} from 'react-router-dom';
import {MatchResult} from 'fuzzy';
require('./AlbumListItem.scss');

interface AlbumListItemProps {
  actions: LibraryActions;
  album: Album;
  filterMatch?: MatchResult;
}

export class AlbumListItem extends React.Component<AlbumListItemProps, {}>{
  render (): JSX.Element {
    const {actions, album, filterMatch} = this.props;
    let name: JSX.Element = <span className="not-filtered">{album.name}</span>;

    if (filterMatch) {
      const match = filterMatch.rendered.split('')
        .map((char: string, i: number, arr: string[]) => {
          if (char === '$') return <span className="empty"></span>;
          if (arr[i - 1] === '$') return <span className="match">{char}</span>;
          return <span className="not-match">{char}</span>
        });
      name = <span className="filtered">{match}</span>;
    }

    return <div className="album-list-item">
      <Link to={`/library/${albumURI(album._id).name}`}>
        <div className="album-image">
          <img src="http://placehold.it/64x64" />
        </div>
        <div className="album-description">
          <span className="album-name">
            {name}
          </span>
          <span className="album-track-count">15 albums</span>
        </div>
      </Link>
    </div>
  }
}
