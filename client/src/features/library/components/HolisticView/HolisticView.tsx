import * as React from 'react';
import {LibraryActions} from '../../actions.d';
import {LibraryState, Artist} from 'definitions';
import {ArtistListItem} from '../ArtistListItem';
import {AlbumsListView} from '../AlbumsListView';
import {AlbumDetailsView} from '../AlbumDetailsView';
import ScrollableDiv from 'components/ScrollableDiv';
import {match} from 'react-router';
import * as fuzzy from 'fuzzy';
import {artistURI} from 'compactd-models';
import * as classnames from "classnames";

const {Flex, Box} = require('reflexbox');

require('./HolisticView.scss');

interface HolisticViewProps {
  actions: LibraryActions;
  library: LibraryState;
  match: match<{artist?: string, album?: string}>;
  all: boolean;
}
interface HolisticViewState {
  artistsFilter: string;
}

export class HolisticView extends React.Component<HolisticViewProps, HolisticViewState> {
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
    const {actions, library} = this.props;

    const options = {
      pre: '$', post: '',
      extract: (el: Artist) => el.name
    };

    const artists = library.artists
    .map(artist => {
      if (this.state.artistsFilter) {
        return [
          fuzzy.match(this.state.artistsFilter, artist.name, options), artist
        ]
      }
      return [undefined, artist];
    }).filter(([matched, artist]: [fuzzy.MatchResult, Artist]) => {
      return this.state.artistsFilter ? matched : true;
    }).sort((a, b) => {
      if (!this.state.artistsFilter) {
        if ((a[1] as Artist).name > (b[1] as Artist).name) return 1;
        if ((a[1] as Artist).name < (b[1] as Artist).name) return -1;
        return 0;
      }
      return (b[0] as fuzzy.MatchResult).score - (a[0] as fuzzy.MatchResult).score;
    }).map(([matched, artist]: [fuzzy.MatchResult, Artist]) => {
      return <ArtistListItem key={artist._id} actions={actions}
              artist={artist} filterMatch={matched} active={
                artistURI(artist._id).name === this.props.match.params.artist
              } counter={library.counters[artist._id]}/>
    })
    return <div className="holistic-view">
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
        <Box col={4}>
          <AlbumDetailsView actions={actions}
            artist={this.props.match.params.artist}
            album={this.props.match.params.album} library={library} />
        </Box>
      </Flex>
    </div>
  }
}
