import * as React from 'react';
import {LibraryActions} from '../../actions.d';
import {Artist} from 'definitions';

require('./ArtistsView.scss');

interface ArtistViewProps {
  actions: LibraryActions;
  artists: Artist[];
}

export class ArtistsView extends React.Component<ArtistViewProps, {}>{
  componentDidMount () {
    this.props.actions.fetchAllArtists();
  }
  render (): JSX.Element {
    const {actions, artists} = this.props;
    const content = artists.map((artist) => {
      return <div className="artist">{artist.name}</div>;
    });
    return <div className="artists-view">
      {content}
    </div>
  }
}
