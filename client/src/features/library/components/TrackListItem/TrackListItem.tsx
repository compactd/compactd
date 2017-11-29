import * as React from 'react';
import {Actions} from 'definitions/actions';
import {Track, LibraryState} from 'definitions';
import * as classnames from 'classnames';
import { ContextMenuTarget, Menu, MenuItem, MenuDivider, Dialog, Button, Popover, Position } from "@blueprintjs/core";
import ArtistComponent from 'components/ArtistComponent';
import {trackURI} from 'compactd-models';

require('./TrackListItem.scss');

interface TrackListItemProps {
  actions: Actions;
  track: Track;
  library: LibraryState;
  playing: boolean;
  playHidden: boolean;
}
@ContextMenuTarget
export class TrackListItem extends React.Component<TrackListItemProps, {
  openSetArtist: boolean
}>{
  constructor () {
    super();
    this.state = {
      openSetArtist: false
    }
  }
  public renderContextMenu() {
    
    // return a single element, or nothing to use default browser behavior
    return (
      <Menu>
        <MenuItem text={this.props.track.name} disabled/>
        <MenuDivider />
        <MenuItem iconName="pt-icon-play" text="Play track" onClick={this.handleClick.bind(this)} />
        <MenuItem iconName="pt-icon-add-to-artifact" text="Play after this track" onClick={() => {
          this.props.actions.playAfter(this.props.track)
        }}/>
        <MenuDivider />
        <MenuItem onClick={() => this.props.actions.toggleHideTrack(this.props.track._id)}
          iconName={this.props.track.hidden ? 'pt-icon-eye-open' : "pt-icon-eye-off"}
          text={this.props.track.hidden ? 'Unhide' : "Hide from track list"} />
        <MenuItem iconName="pt-icon-disable" text="Remove track from library" onClick={() => this.props.actions.offerRemove(this.props.track._id)}/>
        <MenuItem iconName="pt-icon-trash" text="Delete" disabled/>
        <MenuItem iconName="pt-icon-edit" text="Change artist" onClick={() => this.setState({openSetArtist: true})}/>
      </Menu>
    );
  }

  handleClick () {
    const {actions, track, library} = this.props;
    if (this.props.track.offerRemove) return;
    actions.replacePlayerStack([track.album, trackURI(track._id).number], !this.props.playHidden);
  }
  renderArtistSelectContent () {
    const {actions, track, library} = this.props;
    if (!this.state.openSetArtist) return <div className=""></div>;
    const artists = this.props.library.artists.map((artist) => {
      return <ArtistComponent layout="compact" id={artist} onClick={() => {
        this.setState({openSetArtist: false});
        actions.setTrackArtist(track._id, artist)
      }}
      />;
    })
    return <div className="artist-select">
      {artists}
    </div>
  }
  render (): JSX.Element {
    const {actions, track, library, playing} = this.props;
    const date = new Date(null);
    date.setSeconds(track.duration || 0);

    const duration = date.toISOString().substr(14, 5);

    return <div><Popover
      isOpen={this.state.openSetArtist}
      position={Position.BOTTOM}
      content={this.renderArtistSelectContent()}
      onClose={() => this.setState({openSetArtist: false})}>
    <div className={classnames("track-list-item", {playing, hidden: track.hidden, removing: !!track.offerRemove, active: this.state.openSetArtist})} onClick={this.handleClick.bind(this)}>
      <div className="track-number">{track.number}</div>
      <div className="track-name">{track.name}</div>
      <div className="track-info">{track.offerRemove? <div className="remove-offer">remove?
        <div className="yes" onClick={() => actions.doRemove(track._id)}>yes</div>
        <div className="no" onClick={() => actions.offerRemove(track._id, false)}>cancel</div></div>: ''}</div>
      <div className="track-duration">{duration}</div>
    </div></Popover></div>
  }
}
