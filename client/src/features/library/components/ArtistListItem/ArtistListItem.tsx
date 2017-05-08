import * as React from 'react';
import {LibraryActions} from '../../actions.d';
import {Link} from 'react-router-dom';
import {Artist, artistURI} from 'compactd-models';
import BetterImage from 'components/BetterImage';
import {MatchResult} from 'fuzzy';
import * as classnames from 'classnames';
import * as PropTypes from 'prop-types';
import * as pluralize from 'pluralize';

require('./ArtistListItem.scss');

interface ArtistListItemProps {
  actions: LibraryActions;
  artist: Artist;
  filterMatch?: MatchResult;
  counter: {albums?: number, tracks: number};
  active: boolean;
}

export class ArtistListItem extends React.Component<ArtistListItemProps, {}>{

  static contextTypes = {
    router: PropTypes.shape({
      history: PropTypes.shape({
        push: PropTypes.func.isRequired,
        replace: PropTypes.func.isRequired,
        createHref: PropTypes.func.isRequired
      }).isRequired
    }).isRequired
  }
  handleClick (event: any) {
    if (
      !event.defaultPrevented && // onClick prevented default
      event.button === 0// && // ignore right clicks
    //  !this.props.target //&& // let browser handle "target=_blank" etc.
      // !isModifiedEvent(event) // ignore clicks with modifier keys
    ) {
      event.preventDefault()

      const { history } = this.context.router

      history.push(this.props.active ? '/library' : `/library/${
        artistURI(this.props.artist._id).name
      }`);
    }

  }
  componentDidMount () {
    setTimeout(() => {
      this.props.actions.fetchArtistCounter(this.props.artist._id);
    }, 100 + (Math.random() * 600));
  }
  render (): JSX.Element {
    const {
      actions,
      artist,
      filterMatch,
      active,
      counter = {albums: 0, tracks: 0}
    } = this.props;
    const slug = artistURI(artist._id).name;

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

    return <div className={classnames("artist-list-item", {active})}
      onClick={this.handleClick.bind(this)}>
      <div className="artist-image">
        <BetterImage src={`/api/aquarelle/${slug}?s=64`} size={64} />
      </div>
      <div className="artist-description">
        <span className="artist-name">
          {name}
        </span>
        <span className={classnames("artist-album-count", {
          'pt-skeleton': !counter.albums
        })}>{`${counter.albums} ${pluralize('album', counter.albums)} • ${
          counter.tracks
        } ${pluralize('track', counter.tracks)}`}
        </span>
      </div>
    </div>
  }
}
