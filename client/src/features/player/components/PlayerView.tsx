import * as React from 'react';
import { connect } from 'react-redux';
import { bindActionCreators, Dispatch } from 'redux';
import { createStructuredSelector } from 'reselect';
import {actions} from '../player';
import {PlayerActions, PlayerAction} from '../actions.d';
import {PlayerState, CompactdState, LibraryState} from 'definitions';

interface PlayerViewProps {
  actions: PlayerActions;
  player: PlayerState;
  library: LibraryState;
  component: any;
}

@(connect as any)(createStructuredSelector({
  player: (state: CompactdState) => state.player,
  library: (state: CompactdState) => state.library
}), (dispatch: Dispatch<PlayerAction>) => ({
  actions: bindActionCreators(actions, dispatch)
}))
class PlayerView extends React.Component<PlayerViewProps, {}> {
  render (): JSX.Element {
    return <div className="player-block">
      <this.props.component actions={this.props.actions}
        player={this.props.player} library={this.props.library} />
    </div>;
  }
}

export default PlayerView as any;
