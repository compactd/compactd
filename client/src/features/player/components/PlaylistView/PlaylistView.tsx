import * as React from 'react';
import {PlayerActions} from '../../actions.d';
import {Track} from 'compactd-models';
import {PlaylistItem} from '../PlaylistItem';
import {PlayerState} from 'definitions';

require('./PlaylistView.scss');

interface PlaylistViewProps {
  actions: PlayerActions;
  player: PlayerState;
}

export class PlaylistView extends React.Component<PlaylistViewProps, {}>{
  render (): JSX.Element {
    const {actions, player} = this.props;
    const playlist = player.stack.slice(1).map((track, index) => {
      return <PlaylistItem actions={actions} track={track}
        player={player} index={index} />
    });
    return <div className="playlist-view">
      {playlist}
    </div>
  }
}
