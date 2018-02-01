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
import { syncDatabases } from 'app/database';

const {Flex, Box} = require('reflexbox');

require('./HolisticView.scss');

interface HolisticViewProps {
  actions: Actions;
  library: LibraryState;
  player: PlayerState;
  match: match<{artist?: string, album?: string}>;
  all: boolean;
}
interface HolisticViewState {
  artistsFilter: string;
  addingArtist: string;
}


export class HolisticView extends React.Component<HolisticViewProps, HolisticViewState> {
  private oldArtistScroll: [number, number];
  private artistsHash: string;
  private artistsDiv: HTMLDivElement;
  private emitter: EventEmitter;
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
    this.emitter = new EventEmitter();
  }
  componentDidMount () {
    this.props.actions.fetchAllArtists();

    const div = this.artistsDiv;

    this.oldArtistScroll = this.computeRange(div);

    div.addEventListener('scroll', (event) => {
      window.requestAnimationFrame(() => {
        const id = this.artistsHash;

        const [oldStart, oldEnd] = this.oldArtistScroll;
        const [start, end] = this.computeRange(div);

        if (start === oldStart) return;

        if (start > oldStart) {
          this.emitHideRange(id, oldStart, start);
        } else {
          this.emitHideRange(id, end, oldEnd);
        }

        if (start > oldStart) {
          this.emitShowRange(id, oldEnd, end);
        } else {
          this.emitShowRange(id, start, oldStart);
        }
        
        this.oldArtistScroll = [start, end];
      })
    });
  }
  handleArtistsFilterChange (evt: Event) {
    const target = evt.target as HTMLInputElement;
    this.setState({artistsFilter: target.value});
    this.updateHash();
  }
  handleArtistDivRef(id: string, div: HTMLDivElement) {
    this.artistsDiv = div;
  }
  private emitShowRange(id: string, start: number, end: number) {
    for (let i = start ; i < end ; i++) {
      this.emitter.emit(`show-${id}-${i}`);
    }
  }
  private emitHideRange(id: string, start: number, end: number) {
    for (let i = start ; i < end ; i++) {
      this.emitter.emit(`hide-${id}-${i}`);
    }
  }
  componentWillReceiveProps (nextProps: HolisticViewProps) {
    this.updateHash(nextProps);
  }
  hashCode (str: string) {
    var h = 0, l = str.length, i = 0;
    if ( l > 0 )
      while (i < l)
        h = (h << 5) - h + str.charCodeAt(i++) | 0;
    return h;
  }
  private hash() {
    return this.props.library.artists.reduce((acc, val) => {
      return this.hashCode(acc + '::' + val).toString(16);
    }, "BEGIN::" + this.state.artistsFilter + '::');
  }
  private updateHash (props = this.props) {
    const artistsHash = this.hash();
    if (this.artistsHash !== artistsHash) {
      this.emitter.removeAllListeners();
      this.artistsHash = artistsHash;
      this.oldArtistScroll = this.computeRange(this.artistsDiv);
      this.emitShowRange(this.artistsHash, this.oldArtistScroll[0], this.oldArtistScroll[1]);
    }
  }
  private computeRange(div: HTMLDivElement): [number, number] {
    const top = div.scrollTop;
    const height = div.getBoundingClientRect().height;
    const childHeight = 80;
    const length = Math.ceil(height/ childHeight);
    const start = Math.floor(top / childHeight);
    const end = start + length;
    
    return [start, end];
  }
  async handleNewArtist (name: string) {
    this.setState({
      addingArtist: name
    });
    const res = await session.fetch('/api/artists/create', {
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
    const artists = filter(library.artists, this.state.artistsFilter).map((artist, index) => {
      return <ArtistListItem key={artist} actions={actions}
              artist={artist} active={
                artistURI(artist).name === this.props.match.params.artist
              } hash={this.artistsHash}
              emitter={this.emitter}
              index={index}
              visible={index < this.oldArtistScroll[1] + 1}
              />
            }).concat(showAdd ? this.state.addingArtist ? <PlaceholderComponent 
              id="" 
              layout="medium" 
              theme="dark" 
              loading={true} 
              sub="Creating artist"
              header={this.state.addingArtist} /> : 
            (this.state.artistsFilter ? <PlaceholderComponent 
              id="" 
              layout="medium" 
              theme="dark" 
              loading={false} 
              sub="Click to create a new artist"
              onClick={this.handleNewArtist.bind(this, this.state.artistsFilter)} 
              header={this.state.artistsFilter} /> : []) : []);

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
          <ScrollableDiv divRef={(div) => this.handleArtistDivRef(this.artistsHash, div)}>
            {artists}
          </ScrollableDiv>
        </Box>
        <Box col={3}>
          <AlbumsListView actions={actions} match={this.props.match}
            all={this.props.all || !this.props.match.params.artist}
            artist={!this.props.all ? this.props.match.params.artist: undefined} library={library} />
        </Box>
        <Box col={7}>
          <AlbumDetailsView actions={actions} player={player}
            artist={this.props.match.params.artist}
            album={this.props.match.params.album} library={library} />
        </Box>
      </Flex>
    </div>
  }
}
