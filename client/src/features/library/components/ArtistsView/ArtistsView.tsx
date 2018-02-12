import * as React from 'react';
import {LibraryActions} from '../../actions.d';
import {LibraryState} from 'definitions';

require('./ArtistsView.scss');

interface ArtistViewProps {
  actions: LibraryActions;
  library: LibraryState;
}

export class ArtistsView extends React.Component<ArtistViewProps, {}>{
  componentDidMount () {
    this.props.actions.fetchAllArtists();
  }
  render (): JSX.Element {
    const {actions, library} = this.props;
    const content = library.artists.map((artist) => {
      return <div className="artist">{artist}</div>;
    });
    return <div className="artists-view">
      {content}
    </div>
  }
}
