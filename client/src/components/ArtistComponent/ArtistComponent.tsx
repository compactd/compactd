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
import { Tooltip, Position } from '@blueprintjs/core';
import { Databases } from 'definitions/state';

interface ArtistComponentProps {
  id: string;
  subtitle?: 'counters' | 'text' | 'none' | 'artist';
  subtitleText?: string;
  tooltip?: 'none' | 'disabled' | 'on';
  databases: Databases;
}

export default class ArtistComponent extends LibraryItemComp<ArtistComponentProps, {
  artist: Artist,
  counters: number[]
}> {
  private feeds: number[];

  renderSubtitle(): JSX.Element | string{
    const {id, subtitle} = this.props;
    const {counters, artist} = this.state;
    switch (subtitle) {
      case 'counters': 
        if (counters && counters.length === 2) {
          return `${counters[0]} albums · ${counters[1]} tracks`
        }
        return <div className="pt-skeleton">00 albums · 00 tracks</div>
      case 'text': 
        return this.props.subtitleText;
    }
  }

  loadImage(id: string, img: HTMLImageElement): void {
    if (this.isUsingEmbeddedArtworks()) {
      Artwork.getInstance().load(this.props.databases, id, this.getImageSizings(), img);
    }
  }
  
  loadCounters (id: string) {
    if (this.props.subtitle === 'counters') {
      const provider = LibraryProvider.getInstance();
      provider.getArtistCounters(this.props.databases, id).then((counters) => {
        this.setState({counters});
      })
    }
  }

  loadItem(id: string): void {
    const provider = LibraryProvider.getInstance();
    console.log('loadItem(\'' + id + '\'):', this.props);
    this.feeds = [
      provider.liveFeed<Artist>(this.props.databases.artists, id, (artist) => {
        if (id === this.props.id) {
          this.setState({artist});
          this.loadCounters(id);
        }
      })
    ]
  }
  
  unloadItem(): void {
    const provider = LibraryProvider.getInstance();
    provider.cancelFeeds(this.feeds);
    if (this.isUsingEmbeddedArtworks()) {
      URL.revokeObjectURL(this.images[this.props.id].src);
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

  renderImage () {
    if (!this.props.tooltip || this.props.tooltip === 'none') {
      return super.renderImage();
    }
    return <Tooltip
      content={this.state.artist ? this.state.artist.name : 'Please wait...'}
      isDisabled={this.props.tooltip === 'disabled'}
      position={Position.RIGHT}
      tooltipClassName="pt-dark">
      {super.renderImage()}
    </Tooltip>
  }

}