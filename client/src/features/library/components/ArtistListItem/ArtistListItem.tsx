import * as React from 'react';
import {LibraryActions} from '../../actions.d';
import {Link} from 'react-router-dom';
import {Artist, artistURI} from 'compactd-models';
import {MatchResult} from 'fuzzy';

require('./ArtistListItem.scss');

interface ArtistListItemProps {
  actions: LibraryActions;
  artist: Artist;
  filterMatch?: MatchResult;
}

export class ArtistListItem extends React.Component<ArtistListItemProps, {}>{
  render (): JSX.Element {
    const {actions, artist, filterMatch} = this.props;
    let name: JSX.Element = <span className="not-filtered">{artist.name}</span>;

    if (filterMatch) {
      const match = filterMatch.rendered.split('')
        .map((char: string, i: number, arr: string[]) => {
          if (char === '$') return <span className="empty"></span>;
          if (arr[i - 1] === '$') return <span className="match">{char}</span>;
          return <span className="not-match">{char}</span>
        });
      name = <span className="filtered">{match}</span>;
    }

    return <div className="artist-list-item">
      <Link to={`/library/${artistURI(artist._id).name}`}>
        <div className="artist-image">
          <img src="http://placehold.it/64x64" />
        </div>
        <div className="artist-description">
          <span className="artist-name">
            {name}
          </span>
          <span className="artist-album-count">15 albums</span>
        </div>
      </Link>
    </div>
  }
}
