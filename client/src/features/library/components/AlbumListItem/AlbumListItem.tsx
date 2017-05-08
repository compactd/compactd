import * as React from 'react';
import {LibraryActions} from '../../actions.d';
import {Album, albumURI} from 'compactd-models';
import {Link} from 'react-router-dom';
import * as PropTypes from 'prop-types';
import {MatchResult} from 'fuzzy';
import * as classnames from 'classnames';
import BetterImage from 'components/BetterImage';
import * as pluralize from 'pluralize';

require('./AlbumListItem.scss');

interface AlbumListItemProps {
  actions: LibraryActions;
  album: Album;
  filterMatch?: MatchResult;
  all: boolean;
  active?: boolean;
  counter: {tracks: number};
}

export class AlbumListItem extends React.Component<AlbumListItemProps, {}>{
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
      const props = albumURI(this.props.album._id);
      history.push(this.props.active ? '/library' : `/library/${
        this.props.all ? 'all/':  ''}${
        props.artist
      }/${props.name}`);
    }

  }
  componentDidMount () {
    setTimeout(() => {
      this.props.actions.fetchAlbumCounter(this.props.album._id);
    }, 50);
  }
  render (): JSX.Element {
    const {actions, album, filterMatch, active, counter = {tracks: 0}} = this.props;
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
    const p = albumURI(album._id);

    return <div className={classnames("album-list-item", {active})} onClick={this.handleClick.bind(this)}>
      <div className="album-image">
        <BetterImage className={classnames({
          'pt-skeleton': !this.props.counter
        })} src={`/api/aquarelle/${p.artist}/${p.name}?s=64`} size={64} />
      </div>
      <div className="album-description">
        <span className={classnames("album-name", {
          'pt-skeleton': !this.props.counter
        })}>
          {name}
        </span>
        <span className={classnames("album-track-count", {
          'pt-skeleton': !this.props.counter
        })}>
          {counter.tracks} {pluralize('track', counter.tracks)}
        </span>
      </div>
    </div>
  }
}
