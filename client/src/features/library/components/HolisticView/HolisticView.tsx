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
  }
  componentDidMount () {
    this.props.actions.fetchAllArtists();
  }
  handleArtistsFilterChange (evt: Event) {
    const target = evt.target as HTMLInputElement;
    this.setState({artistsFilter: target.value});
  }
  render (): JSX.Element {
    const {actions, library, player} = this.props;
    const artists = library.artists.map((artist) => {
      return <ArtistListItem key={artist} actions={actions}
              artist={artist} active={
                artistURI(artist).name === this.props.match.params.artist
              }/>
    })
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
          <ScrollableDiv>
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
