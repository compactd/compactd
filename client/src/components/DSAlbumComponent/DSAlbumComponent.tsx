import * as React from 'react';
import * as classnames from 'classnames';
import {Album, DSAlbum, albumURI, Artist, DSArtist, artistURI} from 'compactd-models';
import BetterImage from '../BetterImage';
import * as pluralize from 'pluralize';
import Artwork from 'app/Artwork';
import LibraryItemComp from '../LibraryItemComponent';
import './DSAlbumComponent.scss';
import LibraryProvider from 'app/LibraryProvider';
import * as path from 'path';

type Subtitle = 'counters' | 'text' | 'none' | 'artist' | 'year';

interface DSAlbumComponentProps {
  album: DSAlbum
}

export default class DSAlbumComponent extends LibraryItemComp<DSAlbumComponentProps, {
  artists: {[id: string]: Artist},
  albums: {[id: string]: Album},
  counters: {[id: string]: [number]}
}> {
  private feeds: number[];
  constructor () {
    super();
    this.state = {
      artists: {},
      albums: {},
      counters: {}
    };
  }
  renderSubtitle(): JSX.Element | string {
    return this.props.album.artist;
  }

  loadImage(id: string, img: HTMLImageElement): void {
    this.image.src = this.props.album.cover;
  }
  
  loadItem(id: string): void {}

  unloadItem(): void {}

  getClassNames(): string[] {
    return ['ds-album-component'];
  }
  renderHeader(): string | JSX.Element {
    return this.props.album.name;
  }
}