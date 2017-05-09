import * as React from 'react';
import {Actions} from 'definitions/actions';
import {Track, LibraryState} from 'definitions';

require('./TrackListItem.scss');

interface TrackListItemProps {
  actions: Actions;
  track: Track;
  library: LibraryState;
}

export class TrackListItem extends React.Component<TrackListItemProps, {}>{
  handleClick () {
    const {actions, track, library} = this.props;
    actions.replacePlayerStack([track.album, track.number]);
  }
  render (): JSX.Element {
    const {actions, track, library} = this.props;
    const date = new Date(null);
    date.setSeconds(track.duration || 0);

    const duration = date.toISOString().substr(14, 5);

    return <div className="track-list-item" onClick={this.handleClick.bind(this)}>
      <div className="track-number">{track.number}</div>
      <div className="track-name">{track.name}</div>
      <div className="track-info"></div>
      <div className="track-duration">{duration}</div>
    </div>
  }
}
