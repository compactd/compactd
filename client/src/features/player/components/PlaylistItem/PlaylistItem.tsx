import * as React from 'react';
import {PlayerActions} from '../../actions.d';
import {Track} from 'compactd-models';
import {PlayerState} from 'definitions';

require('./PlaylistItem.scss');

interface PlaylistItemProps {
  actions: PlayerActions;
  player: PlayerState;
  track: Track;
  index: number;
}

export class PlaylistItem extends React.Component<PlaylistItemProps, {}>{
  render (): JSX.Element {
    const {actions, track} = this.props;
    return <div className="playlist-item">
      {track.name} - {track.duration}
    </div>
  }
}
