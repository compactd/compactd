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
import {artistURI} from 'compactd-models';
import {FuzzySelector} from '../FuzzySelector'; 
import * as classnames from "classnames";
import {EventEmitter} from 'eventemitter3';

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
    this.state = {artistsFilter: ''};
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
    const artistsHash = (nextProps.library.artists.length * 420).toString(16).substr(0, 5);

    if (this.artistsHash !== artistsHash) {
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

  render (): JSX.Element {
    const {actions, library, player} = this.props;

    const artists = library.artists.map((artist, index) => {
      return <ArtistListItem key={artist} actions={actions}
              artist={artist} active={
                artistURI(artist).name === this.props.match.params.artist
              } hash={this.artistsHash}
              emitter={this.emitter}
              index={index}
              visible={index < this.oldArtistScroll[1] + 1}
              />
    });

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
