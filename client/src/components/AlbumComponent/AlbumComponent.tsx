import * as React from 'react';
import * as classnames from 'classnames';
import {Album, DSAlbum, albumURI, Artist, DSArtist, artistURI} from 'compactd-models';
import BetterImage from '../BetterImage';
import * as pluralize from 'pluralize';
import Artwork from 'app/Artwork';
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
  onClick?: (evt: MouseEvent) => void;
  theme?: 'dark' | 'light';
  subtitle?: 'counters' | 'text' | 'none' | 'artist';
  active?: boolean;
  className?: string;
  counter?: {duration?: number, tracks?: number};
  fuzzyName?: string;
  subtitleText?: string;
}

export default class AlbumComponent extends React.Component<AlbumComponentProps, {}> {
  private static blobCache: {
    [id: string]: [number, Promise<string>]
  } = {};

  increaseCacheLocks (id: string, size: 'large' | 'small') {
    const entryId = id + '!' + size;
    
    if (!AlbumComponent.blobCache[entryId]) {
      if (size === 'large') {
        this.getLargeCover();
      } else {
        this.getSmallCover();
      }
      return;
    }
    const [locks, url] = AlbumComponent.blobCache[entryId];
    AlbumComponent.blobCache[entryId] = [locks + 1, url];
  }

  decreaseCacheLocks (id: string, size: 'large' | 'small') {
    const entryId = id + '!' + size;
    if (!AlbumComponent.blobCache[entryId]) {
      throw new Error('Entry missing');
    }
    const [locks, url] = AlbumComponent.blobCache[entryId];
    if (locks === 1) {
      delete AlbumComponent.blobCache[entryId];
      url.then((uri) => {
        URL.revokeObjectURL(uri);
      });
      return;
    }
    AlbumComponent.blobCache[entryId] = [locks - 1, url];
  }
  componentWillUnmount () {
    const {album, layout} = this.props;
    if (album) {
      if (layout !== 'minimal') {
        this.decreaseCacheLocks(album._id, layout === 'compact' ? 'small' : 'large');
      }
    }
  }
  componentDidMount () { 
    const {artist, layout} = this.props;
    if (artist && artist._id) {
      this.increaseCacheLocks(artist._id, layout === 'compact' ? 'small' : 'large');
    }
  }
  componentWillReceiveProps (nextProps: AlbumComponentProps) {
    
    const {album, layout} = this.props;
    if (!nextProps.album && album) {
      if (layout !== 'minimal') {
        this.decreaseCacheLocks(album._id, layout === 'compact' ? 'small' : 'large');
      }
      return;
    }
    if (nextProps.album && (!album || album._id !== nextProps.album._id)) {
      if (album && album._id) {
        if (layout !== 'minimal') {
          this.decreaseCacheLocks(album._id, layout === 'compact' ? 'small' : 'large');
        }
      }
      this.increaseCacheLocks(nextProps.album._id, nextProps.layout === 'compact' ? 'small' : 'large');
    }
  }
  
  getLargeCover (size = 64) {
    const {album} = this.props;
    const entryId = album._id + '!large';
    
    if (album._id) {
      if (!AlbumComponent.blobCache[entryId]) {
        const url = Artwork.getInstance().get(album._id, 'large')
          .then((blob) => URL.createObjectURL(blob));
        AlbumComponent.blobCache[entryId] = [1, url];
        return url;
      }
      return AlbumComponent.blobCache[entryId][1];
    }
    if (album.largeCover) return album.largeCover;
    if (album.cover) return album.cover;
    return '';
  }
  
  getSmallCover (size = 32) {
    const {album} = this.props;
    const entryId = album._id + '!small';

    if (album._id) {
      if (!AlbumComponent.blobCache[entryId]) {
        const url = Artwork.getInstance().get(album._id, 'small')
          .then((blob) => URL.createObjectURL(blob));
        AlbumComponent.blobCache[entryId] = [1, url];
        return url;
      }
      return AlbumComponent.blobCache[entryId][1];
    }

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
  renderCounters () {
    const {album, subtitle, counter, subtitleText} = this.props;
    return <div className={classnames("album-counter", {
      'pt-skeleton': !counter.tracks,
    })}>{`${counter.tracks || 10} ${pluralize('tracks', counter.tracks || 10)}`}
    </div>;
  }
  renderSubtitle () {
    const {album, subtitle, counter, subtitleText} = this.props;
    if (this.props.layout === 'large') {
      return <div className="large-subtitle">
        {this.props.artist.name ? <div className="album-artist">{this.props.artist.name}</div> : null}
        {counter ? this.renderCounters() : subtitleText}
      </div>
    }
    switch (subtitle) {
      case 'none': return;
      case 'artist': return <div className="album-artist">{this.props.artist.name}</div>;
      case 'text': return <div className="album-text">{subtitleText}</div>;
      case 'counters': return this.renderCounters();
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