import * as React from 'react';
import {LibraryActions} from '../../actions.d';
import {Link} from 'react-router-dom';
import {Artist, artistURI} from 'compactd-models';
import ArtistComponent from 'components/ArtistComponent';
import {MatchResult} from 'fuzzy';
import * as classnames from 'classnames';
import * as PropTypes from 'prop-types';
import * as pluralize from 'pluralize';
import { Databases } from 'definitions/state';

require('./ArtistListItem.scss');

interface ArtistListItemProps {
  actions: LibraryActions;
  artist: string;
  active: boolean;
  emitter?: any;
  hash?: string;
  index?: number;
  visible?: boolean;
  tooltip?: 'none' | 'disabled' | 'on';
  databases: Databases;
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
  handleClick (event: MouseEvent) {
    if (
      !event.defaultPrevented && // onClick prevented default
      event.button === 0// && // ignore right clicks
    //  !this.props.target //&& // let browser handle "target=_blank" etc.
      // !isModifiedEvent(event) // ignore clicks with modifier keys
    ) {
      event.preventDefault()

      const { history } = this.context.router

      history.push(this.props.active ? '/library' : `/library/${
        artistURI(this.props.artist).name
      }`);
    }

  }
  componentDidMount () {
  }
  render (): JSX.Element {
    const {
      actions,
      artist,
      active,
      hash,
      emitter,
      index,
      visible,
      tooltip,
      databases
    } = this.props;
    const slug = artistURI(artist).name;
    return <div className="artist-list-item"> 
      <ArtistComponent 
        active={active} 
        layout='medium' 
        theme='dark' 
        id={artist}
        index={index}
        tooltip={tooltip}
        subtitle='counters'
        databases={databases}
        onClick={this.handleClick.bind(this)} />
    </div>
  }
}
