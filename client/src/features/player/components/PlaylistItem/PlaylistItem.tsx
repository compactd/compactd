import * as React from 'react';
import {PlayerActions} from '../../actions.d';
import {Track} from 'compactd-models';
import {PlayerState, LibraryState} from 'definitions';
import AsyncText from 'components/AsyncText/AsyncText';

require('./PlaylistItem.scss');

interface PlaylistItemProps {
  actions: PlayerActions;
  player: PlayerState;
  track: Track;
  index: number;
}

export class PlaylistItem extends React.Component<PlaylistItemProps, {}>{
  handleItemClick () {
    this.props.actions.jumpTo(this.props.track._id);
  }
  componentDidMount () {
    const {actions, track, player} = this.props;
    if (track.artist) {
      actions.fetchDatabaseArtist(track.artist);
    }
  }
  componentWillUpdateProps (nextProps: PlaylistItemProps) {
    const {actions, track, player} = this.props;
    if (nextProps.track && nextProps.track.artist && nextProps.track.artist !== track.artist) {
      actions.fetchDatabaseArtist(nextProps.track.artist);
    }
  }
  render (): JSX.Element {
    const {actions, track, player} = this.props;

    const date = new Date(null);
    date.setSeconds(track.duration || 0);

    const duration = date.toISOString().substr(14, 5);

    return <div className="playlist-item" onClick={() => this.handleItemClick()}>
      <span className="playlist-duration">{duration}</span>
      <span className="playlist-item-name">{track.name} <AsyncText docId={track.artist} dbName={player.databases.artists} keyName="name" databases={player.databases}/></span>
    </div>
  }
}
