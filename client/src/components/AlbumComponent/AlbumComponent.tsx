import * as React from 'react';
import * as classnames from 'classnames';
import {Album, DSAlbum, albumURI, Artist, DSArtist, artistURI} from 'compactd-models';
import BetterImage from '../BetterImage';
import * as pluralize from 'pluralize';
import Artwork from 'app/Artwork';
import LibraryItemComp from '../LibraryItemComponent';
import './AlbumComponent.scss';
import LibraryProvider from 'app/LibraryProvider';
import * as path from 'path';

type Subtitle = 'counters' | 'text' | 'none' | 'artist' | 'year';

interface AlbumComponentProps {
  id: string,
  subtitle?: Subtitle | Subtitle[];
  subtitleText?: string;
}

export default class AlbumComponent extends LibraryItemComp<AlbumComponentProps, {
  artist: Artist,
  album: Album,
  counters: [number]
}> {
  private feeds: number[];
  renderSubtitle(subtitle = this.props.subtitle): JSX.Element | string{
    const {id} = this.props;
    const {counters, artist, album} = this.state;

    if (Array.isArray(subtitle)) {
      const subs = subtitle.map((sub) => {
        return <div className="subtitle-item">{this.renderSubtitle(sub)}</div>
      });
      return <div className="multiple-subtitles">{subs}</div>;
    }
    
    switch (subtitle) {
      case 'year':
        if (album) {
          return `${album.year}`;
        }
        return <div className="pt-skeleton">2000</div>
      case 'counters': 
        if (counters && counters.length === 1) {
          return `${counters[0]} tracks`
        }
        return <div className="pt-skeleton">00 tracks</div>
      case 'text': 
        return this.props.subtitleText;
      case 'artist': 
        if (artist && artist.name) {
          return artist.name
        }
        return <div className="pt-skeleton">Artist name</div>
    }
  }

  loadImage(img: HTMLImageElement): void {
    if (this.isUsingEmbeddedArtworks()) {
      Artwork.getInstance().load(this.props.id, this.getImageSizings(), this.image);
    }
  }
  
  loadCounters () {
    if (this.props.subtitle === 'counters') {
      const provider = LibraryProvider.getInstance();
      provider.getAlbumCounters(this.props.id).then(([counters]) => {
        this.setState({counters: [counters]});
      })
    }
  }
  loadItem(): void {
    const provider = LibraryProvider.getInstance();
    this.feeds = [
      provider.liveFeed<Artist>('artists', path.dirname(this.props.id), (artist) => {
        this.setState({artist});
        this.loadCounters();
      }),
      provider.liveFeed<Album>('albums', this.props.id, (album) => {
        this.setState({album})
      })
    ]
  }
  unloadItem(): void {
    const provider = LibraryProvider.getInstance();
    provider.cancelFeeds(this.feeds);
    if (this.isUsingEmbeddedArtworks()) {
      URL.revokeObjectURL(this.image.src);
    }
  }
  getClassNames(): string[] {
    return ['album-component'];
  }
  renderHeader(): string | JSX.Element {
    if (this.state.album) {
      return this.state.album.name;
    } else {
      return <div className="pt-skeleton">Artist name</div>
    }
  }

  isUsingEmbeddedArtworks (props = this.props) {
    const {id, layout} = props;
    return (id && layout !== 'minimal' ) && id.startsWith('library/');
  }

}