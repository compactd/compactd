import * as React from 'react';
import {PlayerActions} from '../../actions.d';
import {PlayerAudio} from '../PlayerAudio';
import {PlayerState, LibraryState} from 'definitions';
import StoreView from '../../../store/components/StoreView';
import SettingsLink from '../../../settings/components/SettingsLink';
import {HotkeysTarget, Hotkey, Hotkeys} from '@blueprintjs/core';
import session from 'app/session';
import * as classnames from 'classnames';

require('./PlayerStatus.scss');

interface PlayerStatusProps {
  actions: PlayerActions;
  player: PlayerState;
}
@HotkeysTarget
export class PlayerStatus extends React.Component<PlayerStatusProps, {}>{
  renderHotkeys () {
    const {actions, player} = this.props;
   return <Hotkeys>
     <Hotkey 
      allowInInput={false}
      global={true}
      combo="k"
      label="Toggle playback"
      onKeyDown={(evt) => {
        evt.preventDefault();
        this.handlePlaybackButton();
      }}
     />
     <Hotkey 
      allowInInput={false}
      global={true}
      combo="j"
      label="Play previous track"
      onKeyDown={(evt) => {
        evt.preventDefault();
        if (player.prevStack.length){
          actions.playPrevious();
        }
      }}
     />
     <Hotkey 
      allowInInput={false}
      global={true}
      combo="l"
      label="Play next track"
      onKeyDown={(evt) => {
        evt.preventDefault();
        if (player.stack.length - 1){
          actions.playNext();
        }
      }}
     />
   </Hotkeys> 
  }
  handlePlaybackButton () {
    const {actions, player} = this.props;
    if (player.stack.length > 0) this.props.actions.togglePlayback();
  }
  onAudioEnd () {
    this.props.actions.playNext();
  }
  componentDidMount () {
    if (this.props.player.stack.length && this.props.player.stack[0].artist) {
      this.props.actions.fetchDatabaseArtist(this.props.player.stack[0].artist);
    }
  }
  componentWillReceiveProps (nextProps: PlayerStatusProps) {
    if (!this.props.player.stack.length) {
      return this.props.actions.fetchDatabaseArtist(nextProps.player.stack[0].artist);
    }
    if (nextProps.player.stack[0].artist !== this.props.player.stack[0].artist) {
      this.props.actions.fetchDatabaseArtist(nextProps.player.stack[0].artist);
    }
  }
  render (): JSX.Element {
    const {actions, player} = this.props;
    const track = player.stack[0];
    const date = new Date(null);
    
    if (track) {
      date.setSeconds(track.duration || 0);
    }

    const duration = date.toISOString().substr(14, 5);

    const content = player.stack.length > 0 ?
      <div className="player-name">
        <span className="track-name">{player.stack[0].name}</span>
        <span className="artist-name">{player.artistsById[player.stack[0].artist].name}</span>
        <span className="track-duration">{duration}</span>
      </div> : <div className="player-name">
      </div>
    return <div className="player-status">
      <div className="player-controls">
        <span className={classnames("pt-icon-step-backward play-previous", {
          enabled: player.prevStack.length > 0
        })} onClick={() => actions.playPrevious()}></span>
        <span className={classnames("toggle-playback", {
          'pt-icon-pause': player.playing,
          'pt-icon-play': !player.playing,
          enabled: player.stack.length > 0
        })} onClick={this.handlePlaybackButton.bind(this)}></span>
        <span className={classnames("pt-icon-step-forward play-previous", {
          enabled: player.stack.length > 1
        })} onClick={() => actions.playNext()}></span>
      </div>
      <div className="player-track">
        {content}
        <PlayerAudio source={player.stack[0] ? player.stack[0]._id : undefined}
          playing={player.playing} onEnd={this.onAudioEnd.bind(this)}
          nextSource={player.stack[1] ? player.stack[1]._id : undefined} />
      </div>
      <div className="player-actions">
        <StoreView />
        <SettingsLink />
        <div className="logout-button">
          <span className="pt-icon-log-out pt-icon" onClick={() => {
            session.destroy().then(() =>{
              window.location.reload();
            });
          }}></span>
        </div>
      </div>
    </div>
  }
}
