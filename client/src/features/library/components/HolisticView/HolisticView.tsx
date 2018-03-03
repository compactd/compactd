import * as React from 'react';
import * as PropTypes from 'prop-types';
import {Actions} from 'definitions/actions';
import {LibraryState, Artist, PlayerState} from 'definitions';
import {ArtistListItem} from '../ArtistListItem';
import {AlbumsListView} from '../AlbumsListView';
import {AlbumDetailsView} from '../AlbumDetailsView';
import ScrollableDiv from 'components/ScrollableDiv';
import {match} from 'react-router';
import * as fuzzy from 'fuzzy';
import {artistURI, mapArtistToParams} from 'compactd-models';
import {FuzzySelector} from '../FuzzySelector'; 
import * as classnames from "classnames";
import {EventEmitter} from 'eventemitter3';

import {filter, score} from 'fuzzaldrin';
import PlaceholderComponent from 'components/PlaceholderComponent/PlaceholderComponent';
import { Session } from 'inspector';
import session from 'app/session';
import toaster from 'app/toaster';
import { Tooltip } from '@blueprintjs/core';
import { ArtistListView } from 'features/library/components/ArtistListView';
import { StoreAlbumView } from 'features/library/components/StoreAlbumView';

const {Flex, Box} = require('reflexbox');

require('./HolisticView.scss');

interface HolisticViewProps {
  actions: Actions;
  library: LibraryState;
  player: PlayerState;
  match: match<{artist?: string, album?: string}>;
  all: boolean;
  _store: boolean;
}
interface HolisticViewState {
  artistsFilter: string;
  addingArtist: string;
}


export class HolisticView extends React.Component<HolisticViewProps, HolisticViewState> {
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
    this.state = {artistsFilter: '', addingArtist: null};
  }
  componentDidMount () {
    this.props.actions.fetchAllArtists();
  }
  handleArtistsFilterChange (evt: Event) {
    const target = evt.target as HTMLInputElement;
    this.setState({artistsFilter: target.value});
  }
  
  async handleNewArtist () {
    const name = this.state.artistsFilter;
    this.setState({
      addingArtist: name
    });
    const res = await session.fetch(this.props.library.origin, '/api/artists/create', {
      method: 'POST',
      body: JSON.stringify({name}),
      headers: {
        'content-type': 'application/json'
      }
    });
    const body = await res.json();
    if (res.status !== 201 || !body.ok) {
      toaster.error(body.error);
      return;
    }
    this.setState({
      addingArtist: null
    });
  }
  render (): JSX.Element {
    const {actions, library, player} = this.props;
    const showAdd = this.state.artistsFilter ? !library.artists.includes(artistURI(mapArtistToParams({name: this.state.artistsFilter}))) :  false;
    return <div className="holistic-view">
      <FuzzySelector library={library} actions={actions} />
      <Flex>
        <Box col={2} className={classnames("pt-dark artists-list", {
          minimal: !library.expandArtists
        })}>
          <div className="list-header">
            <div className="pt-input-group">
              <span className="pt-icon pt-icon-search"></span>
              <input className="pt-input" type="search"
                value={this.state.artistsFilter}
                onChange={this.handleArtistsFilterChange.bind(this)}
                onFocus={() => library.expandArtists || actions.toggleExpandArtist()}
                placeholder="Filter artists" dir="auto" />
              <span onClick={actions.toggleExpandArtist}
              className={classnames('pt-icon toggle-expand-artist',
              library.expandArtists ? 'pt-icon-caret-left' : 'pt-icon-caret-right')}></span>
            </div>
          </div>
          
          <div className="top-gradient"></div>
          <ArtistListView match={this.props.match} actions={actions} databases={library.databases} items={library.artists}
          minimal={!library.expandArtists} placeholderState={
            showAdd ? this.state.addingArtist === this.state.artistsFilter ? 'loading' : 
                    (this.state.artistsFilter ? 'on' :'off') : 'off'
          } filter={this.state.artistsFilter} onPlaceholderClick={this.handleNewArtist.bind(this)}/>
        </Box>
        <Box col={3}>
          <AlbumsListView actions={actions} match={this.props.match}
            all={this.props.all || !this.props.match.params.artist}
            artist={!this.props.all ? this.props.match.params.artist: undefined} library={library} />
        </Box>
        <Box col={7} auto>
        {this.props._store ? 
          <StoreAlbumView actions={actions} artist={this.props.match.params.artist}
          album={this.props.match.params.album} library={library} />
          : <AlbumDetailsView actions={actions} player={player}
          artist={this.props.match.params.artist}
          album={this.props.match.params.album} library={library} />
        }
        </Box>
      </Flex>
    </div>
  }
}
