import * as React from 'react';
import {PlayerActions} from '../../actions.d';
import {PlayerAudio} from '../PlayerAudio';
import {PlayerState, LibraryState} from 'definitions';
import StoreView from '../../../store/components/StoreView';
import * as classnames from 'classnames';

require('./PlayerStatus.scss');

interface PlayerStatusProps {
  actions: PlayerActions;
  player: PlayerState;
  library: LibraryState;
}

export class PlayerStatus extends React.Component<PlayerStatusProps, {}>{
  handlePlaybackButton () {
    const {actions, player} = this.props;
    if (player.stack.length > 0) this.props.actions.togglePlayback();
  }
  onAudioEnd () {
    this.props.actions.playNext();
  }
  render (): JSX.Element {
    const {actions, player} = this.props;
    const content = player.stack.length > 0 ?
      <div className="player-name">
        <span className="track-name">{player.stack[0].name}</span>
        <span className="artist-name">{this.props.library.artistsById[player.stack[0].artist].name}</span>
      </div> : <div className="player-name">
      </div>
    return <div className="player-status">
      <div className="player-controls">
        <span className={classnames("pt-icon-step-backward play-previous", {
          enabled: player.prevStack.length > 0
        })}></span>
        <span className={classnames("toggle-playback", {
          'pt-icon-pause': player.playing,
          'pt-icon-play': !player.playing,
          enabled: player.stack.length > 0
        })} onClick={this.handlePlaybackButton.bind(this)}></span>
        <span className={classnames("pt-icon-step-forward play-previous", {
          enabled: player.stack.length > 1
        })}></span>
      </div>
      <div className="player-track">
        {content}
        <PlayerAudio source={player.stack[0] ? player.stack[0]._id : undefined}
          playing={player.playing} onEnd={this.onAudioEnd.bind(this)}
          nextSource={player.stack[1] ? player.stack[1]._id : undefined} />
      </div>
      <div className="player-actions">
        <StoreView />
      </div>
    </div>
  }
}
