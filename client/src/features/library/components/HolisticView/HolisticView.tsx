import * as React from 'react';
import {LibraryActions} from '../../actions.d';
import {LibraryState, Artist} from 'definitions';
import {ArtistListItem} from '../ArtistListItem';
import ScrollableDiv from 'components/ScrollableDiv';
import {match} from 'react-router';
import * as fuzzy from 'fuzzy';

const {Flex, Box} = require('reflexbox');

require('./HolisticView.scss');

interface HolisticViewProps {
  actions: LibraryActions;
  library: LibraryState;
}

export class HolisticView extends React.Component<HolisticViewProps, {}>{
  componentDidMount () {
    this.props.actions.fetchAllArtists();
  }
  render (): JSX.Element {
    const {actions, library} = this.props;
    const artists = library.artists.map((artist) => {
      return <ArtistListItem actions={actions} artist={artist} />
    })
    return <div className="holistic-view">
      <Flex>
        <Box col={2} className="pt-dark artists-list">
          <div className="list-header">
            <div className="pt-input-group">
              <span className="pt-icon pt-icon-search"></span>
              <input className="pt-input" type="search"
                placeholder="Filter artists" dir="auto" />
            </div>
          </div>
          <ScrollableDiv>
          {artists}
          </ScrollableDiv>
        </Box>
        <Box col={2}>
          {(this.props).match.params.artist}
        </Box>
      </Flex>
    </div>
  }
}
