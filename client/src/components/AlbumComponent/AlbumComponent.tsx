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
import { Databases } from 'definitions/state';

type Subtitle = 'counters' | 'text' | 'none' | 'artist' | 'year';

interface AlbumComponentProps {
  id: string,
  subtitle?: Subtitle | Subtitle[];
  subtitleText?: string;
  databases: Databases;
}

export default class AlbumComponent extends LibraryItemComp<AlbumComponentProps, {
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
  
  renderSubtitle(subtitle = this.props.subtitle): JSX.Element | string{
    const {id} = this.props;
    const {counters, artists, albums} = this.state;
    const artist = artists[id];
    const album = albums[id];

    if (Array.isArray(subtitle)) {

      const subs = subtitle.map((sub) => {
        return <div className="subtitle-item" key={sub}>{this.renderSubtitle(sub)}</div>
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
        if (counters[id] && counters[id].length === 1) {
          return `${counters[id][0]} tracks`
        }
        return <div className="pt-skeleton">00 tracks</div>
      case 'text': 
        return this.props.subtitleText;
      case 'artist': 
        if (artist && artist.name) {
          return artist.name;
        }
        return <div className="pt-skeleton">Artist name</div>
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

      provider.getAlbumCounters(this.props.databases, id).then(([counters]) => {
        this.setState({
          counters: {
            ...this.state.counters,
            [id]: [counters]
          }
        });
      })
    }
  }

  loadItem(id: string): void {
    const provider = LibraryProvider.getInstance();
    
    this.feeds = [
      provider.liveFeed<Artist>(this.props.databases.artists, path.dirname(id), (artist) => {
        this.setState({artists: {...this.state.artists, [id]: artist}});
      }),
      provider.liveFeed<Album>(this.props.databases.albums, id, (album) => {
        this.setState({albums: {...this.state.albums, [id]: album}});
        this.loadCounters(id);
      })
    ]
  }

  unloadItem(): void {
    const provider = LibraryProvider.getInstance();
    provider.cancelFeeds(this.feeds);
    if (this.isUsingEmbeddedArtworks() && this.images[this.props.id]) {
      URL.revokeObjectURL(this.images[this.props.id].src);
    }
  }

  getClassNames(): string[] {
    return ['album-component'];
  }

  renderHeader(): string | JSX.Element {
    const {albums} = this.state;
    const album = albums[this.props.id];
    if (album) {
      return album.name;
    } else {
      return <div className="pt-skeleton">Artist name</div>
    }
  }

  isUsingEmbeddedArtworks (props = this.props) {
    const {id, layout} = props;
    return (id && layout !== 'minimal' ) && id.startsWith('library/');
  }

}