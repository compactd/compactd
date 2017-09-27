import * as React from 'react';
import * as classnames from 'classnames';
import {Album, DSAlbum, albumURI, Track, DSTrack, trackURI, Artist, DSArtist, artistURI} from 'compactd-models';
import BetterImage from '../BetterImage';
import * as pluralize from 'pluralize';
import './TrackComponent.scss';

interface TrackProps {
  track: {
    name: string
  } & Partial<Track> & Partial<DSTrack> & any
  artist?: {
    name: string;
  } & Partial<Artist> & Partial<DSArtist> & any;
  album?: {
    name: string;
  } & Partial<Album> & Partial<DSAlbum> & any;
  layout: 'minimal' | 'compact' | 'medium' | 'table-item';
  subtitle?: 'counters' | 'text' | 'none' | 'artist' | 'album' | 'duration';
  theme: 'dark' | 'light',
  onClick?: Function 
}

export default class TrackComponent extends React.Component<TrackProps, {}> {
  render() {
    const {track, artist, album, layout, subtitle = 'artist', theme} = this.props;
    return <div className={classnames("track-component", ``)}>

    </div>
  }
}