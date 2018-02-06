import * as React from 'react';
import {PlayerActions} from '../../actions.d';
import {Track} from 'compactd-models';
import {PlaylistItem} from '../PlaylistItem';
import {PlayerState, LibraryState} from 'definitions';
import {PlayerAudio} from '../PlayerAudio';
import { ScrollableDiv } from 'components';
import { CurrentPlayingView } from 'features/player/components/CurrentPlayingView';

require('./PlaylistView.scss');

interface PlaylistViewProps {
  actions: PlayerActions;
  player: PlayerState;
}

const tokens = {};
const infoHeight = 54 + 30;

export class PlaylistView extends React.Component<PlaylistViewProps, {offset: number}>{
  private currentPlayingContainer: HTMLDivElement;
  constructor () {
    super();
    this.state = {offset: 0};
  }
  getCurrentInfoHeight () {
    return window.innerWidth * (1 / 6) + infoHeight;
  }
  componentDidMount () {
    window.addEventListener('resize', (evt) => {
      window.requestAnimationFrame(() => {
        this.updateOffset();
      })
    });
    this.updateOffset();
  }
  updateOffset() {
    if (!this.currentPlayingContainer) {
      return;
    }
    const height = this.getCurrentInfoHeight();
    if (height !== this.state.offset) {
      this.setState({offset: height});
    }
  }
  componentDidUpdate () {
    this.updateOffset();
  }
  render (): JSX.Element {
    const {actions, player} = this.props;

    const playlist = player.stack.slice(1).map((track, index) => {
      return <PlaylistItem actions={actions} track={track}
        player={player} index={index} />
    });
    return <div className="playlist-view">
     <ScrollableDiv offset={-this.state.offset}>
       {playlist}
     </ScrollableDiv>
     <div className="current-player-container" ref={(ref) => this.currentPlayingContainer = ref}>
        <CurrentPlayingView actions={actions} player={player}/>
     </div>
    </div>
  }
}
