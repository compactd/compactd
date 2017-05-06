import * as React from 'react';
import {LibraryActions} from '../../actions.d';
import {LibraryState} from 'definitions';
import {ArtistListItem} from '../ArtistListItem';
import ScrollableDiv from 'components/ScrollableDiv';

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
        <Box col={2}>
          <ScrollableDiv>
          {artists}
          </ScrollableDiv>
        </Box>
        <Box col={2}>

        yoooo
        </Box>
      </Flex>
    </div>
  }
}
