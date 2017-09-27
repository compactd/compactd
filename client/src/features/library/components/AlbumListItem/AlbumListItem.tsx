import * as React from 'react';
import {LibraryActions} from '../../actions.d';
import {Album, albumURI} from 'compactd-models';
import {Link} from 'react-router-dom';
import * as PropTypes from 'prop-types';
import {MatchResult} from 'fuzzy';
import * as classnames from 'classnames';
import BetterImage from 'components/BetterImage';
import AlbumComponent from 'components/AlbumComponent';
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
  handleClick (event: MouseEvent) {
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
    
    return <div className="album-list-item">
        <AlbumComponent
          active={active}
          layout="medium" 
          theme="dark" 
          subtitle="counters"
          counter={counter} 
          album={album} 
          fuzzyName={filterMatch && filterMatch.rendered} 
          onClick={this.handleClick.bind(this)}/>
      </div>
  }
}
