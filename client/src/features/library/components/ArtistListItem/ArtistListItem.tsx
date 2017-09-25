import * as React from 'react';
import {LibraryActions} from '../../actions.d';
import {Link} from 'react-router-dom';
import {Artist, artistURI} from 'compactd-models';
import ArtistComponent from 'components/ArtistComponent';
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
    }, 50);
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

    return <ArtistComponent layout='medium' theme='dark' 
      artist={artist} fuzzyName={filterMatch && filterMatch.rendered}
       counter={counter} subtitle='counters' />
    // return <div className={classnames("artist-list-item", {active})}
    //   onClick={this.handleClick.bind(this)}>
    //   <div className="artist-image">
    //     <BetterImage src={`/api/aquarelle/${slug}?s=64`} size={64} />
    //     <div className={classnames("image-overlay", {
    //       hidden: !!counter.albums
    //     })}></div>
    //   </div>
    //   <div className="artist-description">
    //     <span className={classnames("artist-name", {
    //       'pt-skeleton': !counter.albums
    //     })}>
    //       {name}
    //     </span>
    //     <span className={classnames("artist-album-count", {
    //       'pt-skeleton': !counter.albums
    //     })}>{`${counter.albums} ${pluralize('album', counter.albums)} • ${
    //       counter.tracks
    //     } ${pluralize('track', counter.tracks)}`}
    //     </span>
    //   </div>
    // </div>
  }
}
