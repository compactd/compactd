import * as React from 'react';
import {Actions} from 'definitions/actions';
import {Track, LibraryState} from 'definitions';
import * as classnames from 'classnames';
import { ContextMenuTarget, Menu, MenuItem, MenuDivider, Dialog, Button } from "@blueprintjs/core";

require('./TrackListItem.scss');

interface TrackListItemProps {
  actions: Actions;
  track: Track;
  library: LibraryState;
  playing: boolean;
  playHidden: boolean;
}
@ContextMenuTarget
export class TrackListItem extends React.Component<TrackListItemProps, {}>{
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
      </Menu>
    );
  }

  handleClick () {
    const {actions, track, library} = this.props;
    if (this.props.track.offerRemove) return;
    actions.replacePlayerStack([track.album, track.number], !this.props.playHidden);
  }
  render (): JSX.Element {
    const {actions, track, library, playing} = this.props;
    const date = new Date(null);
    date.setSeconds(track.duration || 0);

    const duration = date.toISOString().substr(14, 5);

    return <div className={classnames("track-list-item", {playing, hidden: track.hidden, removing: !!track.offerRemove})} onClick={this.handleClick.bind(this)}>
      <div className="track-number">{track.number}</div>
      <div className="track-name">{track.name}</div>
      <div className="track-info">{track.offerRemove? <div className="remove-offer">remove?
        <div className="yes" onClick={() => actions.doRemove(track._id)}>yes</div>
        <div className="no" onClick={() => actions.offerRemove(track._id, false)}>cancel</div></div>: ''}</div>
      <div className="track-duration">{duration}</div>
    </div>
  }
}
