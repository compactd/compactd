import * as React from 'react';
import * as classnames from 'classnames';
import {Album, DSAlbum, albumURI, Artist, DSArtist, artistURI, Tracker, Release} from 'compactd-models';
import BetterImage from '../BetterImage';
import * as pluralize from 'pluralize';
import Artwork from 'app/Artwork';
import LibraryItemComp from '../LibraryItemComponent';
import './DSAlbumComponent.scss';
import LibraryProvider from 'app/LibraryProvider';
import * as path from 'path';
import * as qs from 'querystring';
import Session from 'app/session';
import PouchDB from 'pouchdb';
const groupBy = require('lodash.groupby');
import Map from 'models/Map';
import { Tooltip } from '@blueprintjs/core';

interface DSAlbumComponentProps {
  album: DSAlbum
}

export default class DSAlbumComponent extends LibraryItemComp<DSAlbumComponentProps, {}> {
  private feeds: number[];
  constructor () {
    super();
  }
  renderSubtitle(): JSX.Element | string {
    
    return 'Click to see results';
  }

  loadImage(id: string, img: HTMLImageElement): void {
    img.src = this.props.album.cover;
  }
  
  async loadItem(id: string): Promise<void> {
    
  }

  unloadItem(): void {}

  getClassNames(): string[] {
    return ['ds-album-component'];
  }
  renderHeader(): string | JSX.Element {
    return this.props.album.name;
  }
}
