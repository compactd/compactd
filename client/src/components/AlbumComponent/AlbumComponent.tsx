import * as React from 'react';
import * as classnames from 'classnames';
import {Album, DSAlbum, albumURI, Artist, DSArtist, artistURI} from 'compactd-models';
import BetterImage from '../BetterImage';
import * as pluralize from 'pluralize';
import './AlbumComponent.scss';

interface AlbumComponentProps {
  artist?: {
    name: string;
    cover?: string;
    largeCover?: string;
  } & Partial<Artist> & Partial<DSArtist> & any;
  album: {
    name: string;
    cover?: string;
    largeCover?: string;
  } & Partial<Album> & Partial<DSAlbum> & any;
  layout: 'minimal' | 'compact' | 'medium' | 'large';
  mode?: 'popup' | 'normal';
  onClick?: Function;
  theme?: 'dark' | 'light';
  subtitle?: 'counters' | 'text' | 'none' | 'artist';
  active?: boolean;
  className?: string;
  counter?: {duration?: number, tracks: number};
  fuzzyName?: string;
  subtitleText?: string;
}

export default class AlbumComponent extends React.Component<AlbumComponentProps, {}> {
  getLargeCover (size = 64) {
    const {album} = this.props;
    const p = albumURI(album._id);

    if (album._id) return `/api/aquarelle/${p.artist}/${p.name}?s=${size}`;
    if (album.largeCover) return album.largeCover;
    if (album.cover) return album.cover;
    return '';
  }
  getSmallCover (size = 32) {
    const {album} = this.props;
    const p = albumURI(album._id);

    if (album._id) return `/api/aquarelle/${p.artist}/${p.name}?s=${size}`;
    if (album.cover) return album.cover;
    if (album.largeCover) return album.largeCover;
    return '';
  }
  renderImage (): JSX.Element {
    const {album} = this.props;
    
    switch (this.props.layout) {
      case 'minimal': return;
      case 'compact': 
        return <BetterImage src={this.getSmallCover(32)} size={32} />;
      case 'medium':
        return <BetterImage src={this.getLargeCover(64)} size={64} />;
      case 'large':
        return <BetterImage src={this.getLargeCover(128)} size={128} />;
    }
  }
  renderSubtitle () {
    const {album, subtitle, counter, subtitleText} = this.props;
    if (this.props.layout === 'large') {
      return <div className="large-subtitle">
        {this.props.artist.name ? <div className="album-artist">{this.props.artist.name}</div> : null}
        {counter ? <div className={classnames("album-counter", {
          'pt-skeleton': !counter.tracks,
        })}>{`${counter.tracks} ${pluralize('tracks', counter.tracks)}`}
        </div> : subtitleText}
      </div>
    }
    switch (subtitle) {
      case 'none': return;
      case 'artist': return <div className="album-artist">{this.props.artist.name}</div>;
      case 'text': return <div className="album-text">{subtitleText}</div>;
      case 'counters': return <div className={classnames("album-counter", {
          'pt-skeleton': !counter.tracks
        })}>{`${counter.tracks} ${pluralize('tracks', counter.tracks)}`}
        </div>;
    }
  }
  renderName () {
    if (this.props.fuzzyName) {
      const match = Array.from(this.props.fuzzyName)
        .map((char: string, i: number, arr: string[]) => {
          if (char === '$') return <span className="empty"></span>;
          if (arr[i - 1] === '$') return <span className="match">{char}</span>;
          return <span className="not-match">{char}</span>
        });
        
      return <span className="filtered">{match}</span>;
    }
    return this.props.album.name;
  }
  render () {
    const {
      album,
      layout,
      mode = 'normal',
      onClick = new Function(),
      theme = 'light',
      className = '',
      active = false,
      fuzzyName} = this.props;


    return <div className={classnames(className, 'album-component', `${theme}-theme`, `${layout}-layout`, {active,
        'clickable': !!this.props.onClick
        })} onClick={onClick as any}>
      <div className="album-image">{this.renderImage()}</div>
      <div className="album-info">
        <div className="album-name">
          {this.renderName()}
        </div>
        <div className="album-subtitle">
          {this.renderSubtitle()}
        </div>
      </div>
    </div>
  }

}