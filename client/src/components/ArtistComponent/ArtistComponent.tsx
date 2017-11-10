import * as React from 'react';
import * as classnames from 'classnames';
import {Artist, DSArtist, artistURI} from 'compactd-models';
import BetterImage from '../BetterImage';
import * as pluralize from 'pluralize';
import './ArtistComponent.scss';
import Artwork from 'app/Artwork';

interface ArtistComponentProps {
  artist: {
    name: string;
    cover?: string;
    largeCover?: string;
  } & Partial<Artist> & Partial<DSArtist> & any;
  layout: 'minimal' | 'compact' | 'medium' | 'large';
  mode?: 'popup' | 'normal';
  onClick?: Function;
  theme?: 'dark' | 'light';
  subtitle?: 'counters' | 'text' | 'none';
  active?: boolean;
  className?: string;
  counter?: {albums?: number, tracks?: number};
  fuzzyName?: string;
  subtitleText?: string;
}

export default class ArtistComponent extends React.Component<ArtistComponentProps, {}> {
  private static blobCache: {
    [id: string]: [number, Promise<string>]
  } = {};

  increaseCacheLocks (id: string, size: 'large' | 'small') {
    const entryId = id + '!' + size;
    
    if (!ArtistComponent.blobCache[entryId]) {
      if (size === 'large') {
        this.getLargeCover();
      } else {
        this.getSmallCover();
      }
      return;
    }
    const [locks, url] = ArtistComponent.blobCache[entryId];
    ArtistComponent.blobCache[entryId] = [locks + 1, url];
  }

  decreaseCacheLocks (id: string, size: 'large' | 'small') {
    const entryId = id + '!' + size;
    if (!ArtistComponent.blobCache[entryId]) {
      throw new Error('Entry missing');
    }
    const [locks, url] = ArtistComponent.blobCache[entryId];
    if (locks === 1) {
      url.then((uri) => {
        URL.revokeObjectURL(uri);
        delete ArtistComponent.blobCache[entryId];
      });
      return;
    }
    ArtistComponent.blobCache[entryId] = [locks - 1, url];
  }
  componentWillUnmount () {
    const {artist, layout} = this.props;
    if (artist) {
      if (layout !== 'minimal') {
        this.decreaseCacheLocks(artist._id, layout === 'compact' ? 'small' : 'large');
      }
    }
  }

  getLargeCover (size = 64) {
    const {artist} = this.props;
    const entryId = artist._id + '!large';
    if (artist._id) {
      if (!ArtistComponent.blobCache[entryId]) {
        const url = Artwork.getInstance().get(artist._id, 'large')
          .then((blob) => URL.createObjectURL(blob));
        ArtistComponent.blobCache[entryId] = [1, url];
        return url;
      }
      return ArtistComponent.blobCache[entryId][1];
    }
    if (artist.largeCover) return artist.largeCover;
    if (artist.cover) return artist.cover;
    return '';
  }
  getSmallCover (size = 32) {
    const {artist} = this.props;
    const entryId = artist._id + '!small';

    if (artist._id) {
      if (!ArtistComponent.blobCache[entryId]) {
        const url = Artwork.getInstance().get(artist._id, 'small')
          .then((blob) => URL.createObjectURL(blob));
        ArtistComponent.blobCache[entryId] = [1, url];
        return url;
      }
      return ArtistComponent.blobCache[entryId][1];
    }

    if (artist.cover) return artist.cover;
    if (artist.largeCover) return artist.largeCover;
    return '';
  }
  componentDidMount () {
    const {artist, layout} = this.props;
    if (artist && artist._id) {
      this.increaseCacheLocks(artist._id, layout === 'compact' ? 'small' : 'large');
    }
  }
  componentWillReceiveProps (nextProps: ArtistComponentProps) {
    
    const {artist, layout} = this.props;
    if (!nextProps.artist && artist) {
      if (layout !== 'minimal') {
        this.decreaseCacheLocks(artist._id, layout === 'compact' ? 'small' : 'large');
      }
      return;
    }
    if (nextProps.artist && (!artist || artist._id !== nextProps.artist._id)) {
      if (artist && artist._id) {
        if (layout !== 'minimal') {
          this.decreaseCacheLocks(artist._id, layout === 'compact' ? 'small' : 'large');
        }
      }
      this.increaseCacheLocks(nextProps.artist._id, nextProps.layout === 'compact' ? 'small' : 'large');
    }
  }
  renderImage (): JSX.Element {
    const {artist} = this.props;
    
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
    const {artist, subtitle, counter, subtitleText} = this.props;
    return <div className={classnames("artist-counter", {
      'pt-skeleton': !counter.albums
    })}>{`${counter.albums || 10} ${pluralize('album', counter.albums || 10)} • ${
      counter.tracks || 10
    } ${pluralize('track', counter.tracks || 10)}`}
    </div>;
  }
  renderSubtitle () {
    const {artist, subtitle, counter, subtitleText} = this.props;
    if (this.props.layout === 'large') {
      return <div className="large-subtitle">
        {counter ? this.renderCounters() : null}
        {subtitleText ? <div className="artist-text">{subtitleText}</div> : null}
      </div>
    }
    switch (subtitle) {
      case 'none': return;
      case 'text': return <div className="artist-text">{subtitleText}</div>;
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
    return this.props.artist.name;
  }
  render () {
    const {
      artist,
      layout,
      mode = 'normal',
      onClick = new Function(),
      theme = 'light',
      className = '',
      active = false,
      fuzzyName} = this.props;


    return <div className={classnames(className, 'artist-component', `${theme}-theme`, `${layout}-layout`, {active,
        'clickable': !!this.props.onClick
        })} onClick={onClick as any}>
      <div className="artist-image">{this.renderImage()}</div>
      <div className="artist-info">
        <div className="artist-name">
          {this.renderName()}
        </div>
        <div className="artist-subtitle">
          {this.renderSubtitle()}
        </div>
      </div>
    </div>
  }

}