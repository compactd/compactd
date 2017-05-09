import * as React from 'react';
import {PlayerActions} from '../../actions.d';

require('./PlayerStatus.scss');

interface PlayerStatusProps {
  actions: PlayerActions;
}

export class PlayerStatus extends React.Component<PlayerStatusProps, {}>{
  render (): JSX.Element {
    const {actions} = this.props;
    return <div className="player-status">
    </div>
  }
}