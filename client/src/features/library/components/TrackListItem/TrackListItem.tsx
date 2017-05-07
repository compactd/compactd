import * as React from 'react';
import {LibraryActions} from '../../actions.d';
import {Track, LibraryState} from 'definitions';

require('./TrackListItem.scss');

interface TrackListItemProps {
  actions: LibraryActions;
  track: Track;
  library: LibraryState;
}

export class TrackListItem extends React.Component<TrackListItemProps, {}>{
  render (): JSX.Element {
    const {actions, track, library} = this.props;
    return <div className="track-list-item">
      {track.name}
    </div>
  }
}
