import * as React from 'react';
import {PlayerActions} from '../../actions.d';
import {Track} from 'compactd-models';
import {PlayerState, LibraryState} from 'definitions';

require('./PlaylistItem.scss');

interface PlaylistItemProps {
  actions: PlayerActions;
  player: PlayerState;
  library: LibraryState;
  track: Track;
  index: number;
}

export class PlaylistItem extends React.Component<PlaylistItemProps, {}>{
  handleItemClick () {
    this.props.actions.jumpTo(this.props.track._id);
  }
  render (): JSX.Element {
    const {actions, track, library} = this.props;

    const date = new Date(null);
    date.setSeconds(track.duration || 0);

    const duration = date.toISOString().substr(14, 5);

    return <div className="playlist-item" onClick={() => this.handleItemClick()}>
      <span className="playlist-duration">{duration}</span>
      <span className="playlist-item-name">{track.name} ― {library.artistsById[track.artist].name}</span>
    </div>
  }
}
