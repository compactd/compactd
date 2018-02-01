import * as React from 'react';
import {Actions} from 'definitions/actions';
import {LibraryState, CompactdState, PlayerState, Track} from 'definitions';
import * as numeral from 'numeral';

interface TrackItemProps {
  actions: Actions;
  library: LibraryState;
  track: string;
  reports?: number;
  index: number;
}
export default class TrackItem extends React.Component<TrackItemProps, {}> {
  componentDidMount () {
    const {actions, library, track} = this.props;
    
    actions.fetchTrack(track);
  }
  componentWillReceiveProps (nextProps: TrackItemProps) {
    const {actions, library, track} = this.props;
    
    if (nextProps.library.tracksById[track] && !library.tracksById[track]) {
      const item = nextProps.library.tracksById[track];
      actions.fetchArtist(item.artist);
    }
  }
  private handleClick (evt: MouseEvent) {
    const {actions, library, track, reports} = this.props;
    if (evt.altKey) {
      this.handleAltClick(evt);
      return;
    }
    const stack = library.topTracks.map((el) => el.key).slice(this.props.index);
    actions.replacePlayerStack(stack);
  }
  private handleAltClick (evt: MouseEvent) {
    evt.stopPropagation();
    const {actions, library, track, reports} = this.props;
    const item = library.tracksById[track]; 
    actions.playAfter(item);
  }
  render () {
    const {actions, library, track, reports} = this.props;
    const item = library.tracksById[track]; 

    if (item && library.artistsById[item.artist]) {
      const artist = library.artistsById[item.artist];
      return <div className="track-item" onClick={this.handleClick.bind(this)}>
        <div className="track-name">{item.name}</div>
        <div className="track-artist">{artist.name}</div>
        <div className="">
          <span className="pt-icon-add-to-artifact track-float" onClick={this.handleAltClick.bind(this)}>

          </span>
          {/* <div className="track-reports">
            {numeral(reports).format('0[.]0a')}
          </div> */}
        </div>
      </div>;
    }

    return <div className="track-item pt-skeleton">
      <div className="track-name">Please wait</div>
      <div className="track-artist"></div>
    </div>;
  }
}