import * as React from 'react';
import {PlayerActions} from '../../actions.d';

require('./PlayerAudio.scss');

interface PlayerAudioProps {
  actions: PlayerActions;
}

export class PlayerAudio extends React.Component<PlayerAudioProps, {}>{
  render (): JSX.Element {
    const {actions} = this.props;
    return <div className="player-audio">
    </div>
  }
}