import * as React from 'react';
import * as classnames from 'classnames';
import {Album, DSAlbum, albumURI, Artist, DSArtist, artistURI} from 'compactd-models';
import BetterImage from '../BetterImage';
import * as pluralize from 'pluralize';
import Artwork from 'app/Artwork';
import LibraryItemComp from '../LibraryItemComponent';
import LibraryProvider from 'app/LibraryProvider';
import * as path from 'path';
import './ArtistComponent.scss';

interface ArtistComponentProps {
  id: string,
  subtitle?: 'counters' | 'text' | 'none' | 'artist';
  subtitleText?: string;
}

export default class ArtistComponent extends LibraryItemComp<ArtistComponentProps, {
  artist: Artist,
  counters: [number]
}> {
  private feeds: number[];
  renderSubtitle(): JSX.Element | string{
    const {id, subtitle} = this.props;
    const {counters, artist} = this.state;
    switch (subtitle) {
      case 'counters': 
        if (counters && counters.length === 1) {
          return `${counters[0]} tracks`
        }
        return <div className="pt-skeleton">00 albums · 00 tracks</div>
      case 'text': 
        return this.props.subtitleText;
    }
  }

  loadImage(img: HTMLImageElement): void {
    if (this.isUsingEmbeddedArtworks()) {
      Artwork.getInstance().load(this.props.id, this.getImageSizings(), this.image);
    }
  }
  loadItem(): void {
    const provider = LibraryProvider.getInstance();
    this.feeds = [
      provider.liveFeed<Artist>('artists', this.props.id, (artist) => {
        this.setState({artist});
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
    return ['artist-component'];
  }
  renderHeader(): string | JSX.Element {
    if (this.state.artist) {
      return this.state.artist.name;
    } else {
      return <div className="pt-skeleton">Artist name</div>
    }
  }

  isUsingEmbeddedArtworks (props = this.props) {
    const {id, layout} = props;
    return (id && layout !== 'minimal' ) && id.startsWith('library/');
  }

}