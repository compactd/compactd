import * as React from 'react';
import {LibraryActions} from '../../actions.d';
import Map from 'models/Map';
import session from 'app/session';
import { join } from 'path';
import { LibraryState } from 'definitions';
import DSAlbumComponent from 'components/DSAlbumComponent/DSAlbumComponent';
import AsyncText from 'components/AsyncText/AsyncText';
import { ScrollableDiv } from 'components';
import * as classNames from 'classnames';
import { Spinner } from '@blueprintjs/core';
import * as PropTypes from 'prop-types';
import { albumURI, mapAlbumToParams } from 'compactd-models/dist';

require('./StoreAlbumView.scss');

interface StoreAlbumViewProps {
  actions: LibraryActions;
  album: string;
  artist: string;
  library: LibraryState;
}

export class StoreAlbumView extends React.Component<StoreAlbumViewProps, {
  stores: Map<any>,
  expanded: Map<boolean>
}>{
  static contextTypes = {
    router: PropTypes.shape({
      history: PropTypes.shape({
        push: PropTypes.func.isRequired,
        replace: PropTypes.func.isRequired,
        createHref: PropTypes.func.isRequired
      }).isRequired
    }).isRequired
  }
  constructor () {
    super();
    this.state = {stores: {}, expanded: {}};
  }
  async searchAlbum(artist: string, album: string) {

    this.props.actions.searchStore('library/' + artist, album)
  }
  componentDidMount () {
    if (this.props.album) {
      this.searchAlbum(this.props.artist, this.props.album);
    }
  }
  componentWillReceiveProps (nextProps: StoreAlbumViewProps) {
    if (this.props.album !== nextProps.album && nextProps.album) {
      this.searchAlbum(nextProps.artist, nextProps.album);
    } 
  }
  renderResults () {
    const id = join('library', this.props.artist, this.props.album);
    const results = this.props.library.resultsById[id];
    
    if (!results) {
      return <div className="album-details-loader">
        <Spinner />
      </div>;
    }

    return Object.keys(results).map((storeId) => {
      const items = results[storeId];
      return <div className="store-row">
        <div className="row-header"><AsyncText docId={storeId} dbName="stores" keyName="name"/></div>
        <div className="row-content">
          {items.slice(0, this.state.expanded[storeId] ? items.length : 3).map((item) => {
            return <div className="result-row" onClick={() => {
              const id = join('/library', this.props.artist);
              session.post('/api/' + storeId, {result: item._id});
              const { history } = this.context.router;
              history.push(id);
            }}>
              <span className="result-name">{item.name}</span>
              <span className="result-format pt-tag pt-minimal">{item.format}</span>
              <span className="result-stats">{item.stats.map((stat) => {
                return <span><span className={"pt-icon-" + stat.icon}></span>{stat.value}</span>
              })}</span>
            </div>
          }).concat(Object.keys(items).length > 3 ? <div className="result-row centered" onClick={() => {
            this.setState({
              expanded: {...this.state.expanded, [storeId]: !this.state.expanded[storeId]}
            });
          }}>
          <div className="load-more"><span className={classNames({
            'pt-icon-caret-down': !this.state.expanded[storeId],
            'pt-icon-caret-up': this.state.expanded[storeId]
          })}></span></div>
        </div> : [])}
        </div>
      </div>
    })
  }
  render (): JSX.Element {
    const {actions, library, album} = this.props;
    const artistId = 'library/' + this.props.artist;

    const dsResults = library.dsResultsById[artistId];

    if (!dsResults) {
      return <div className="album-details-loader">
        <Spinner />
      </div>;
    }

    const dsResult = dsResults.find((el) => el.name === album);
    return <div className="store-album-view">
      <ScrollableDiv>{this.renderResults()}</ScrollableDiv>
    </div>
  }
}