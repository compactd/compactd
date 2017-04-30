import * as React from 'react';
import {ILibraryActions} from '../../actions.d';
import {IArtist} from 'definitions';

require('./ArtistsView.scss');

interface IArtistViewProps {
  actions: ILibraryActions;
  artists: IArtist[];
}

export class ArtistsView extends React.Component<IArtistViewProps, {}>{
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
