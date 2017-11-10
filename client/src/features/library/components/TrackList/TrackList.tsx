import * as React from 'react';
import {Actions} from 'definitions/actions';
import {LibraryActions} from '../../actions.d';
import {LibraryState, PlayerState} from 'definitions';
import {TrackListItem} from '../TrackListItem';
import {Track} from 'compactd-models';

require('./TrackList.scss');

interface TrackListProps {
  actions: Actions;
  tracks: Track[];
  library: LibraryState;
  player: PlayerState;
}

export class TrackList extends React.Component<TrackListProps, {
  showHidden: boolean
}>{
  constructor() {
    super();
    this.state = {showHidden: false};
  }
  render (): JSX.Element {
    const {actions, tracks, player, library} = this.props;
    const content = tracks.map((track, index) => {
      const el = <TrackListItem track={track} actions={actions} library={library} key={track._id}
      playing={player.stack.length && player.stack[0]._id === track._id} playHidden={this.state.showHidden} />;
      
      if (track.hidden && !this.state.showHidden) {
        if (index > 0 && tracks[index - 1].hidden) return;
        return <div className="missing-track" onClick={() => {
          this.setState({showHidden: true})
        }}><div className="ellipsis">•••</div><div className="separator"></div></div>
      }
      if (track.hidden && this.state.showHidden) {
        if (index > 0 && tracks[index - 1].hidden) {
          return el;
        };
        return <div><div className="missing-track" onClick={() => {
          this.setState({showHidden: false})
        }}><div className="ellipsis">-</div><div className="separator"></div></div>{el}</div>
      }
      return el;
    })
    return <div className="track-list">
      {content}
    </div>
  }
}