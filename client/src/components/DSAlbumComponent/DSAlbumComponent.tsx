import * as React from 'react';
import * as classnames from 'classnames';
import {Album, DSAlbum, albumURI, Artist, DSArtist, artistURI, Tracker, Release, mapAlbumToParams} from 'compactd-models';
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
import { getDatabase } from 'app/database';
import session from 'app/session';


interface DSAlbumComponentProps {
  album: DSAlbum
}

export default class DSAlbumComponent extends LibraryItemComp<DSAlbumComponentProps, {
  releases: Map<Release[]>;
  downloading: boolean;
}> {
  private feeds: number[];
  constructor () {
    super();
    this.state = {
      releases: {},
      downloading: false
    };
  }
  renderYT () {
    return <Tooltip content="Add the album, allowing you to stream from youtube">
      <span onClick={async () => {
        this.setState({downloading: true});
        const url = path.join('/api/datasource/albums/', this.props.album.artist, this.props.album.name);
        const res = await session.fetch(url);
        const data = await res.json();
        console.log(data);
        
        const albums = await getDatabase('albums');
        const id = albumURI(mapAlbumToParams({
          name: this.props.album.name,
          artist: this.props.album.artist
        }));
        await albums.put({
          _id: id, 
          name: this.props.album.name,
          artist: this.props.album.artist
        });

        Promise.all(data.tracks.)
      }} className={classnames("pt-tag pt-minimal", {
      "pt-intent-danger": true
    })} ><div className="pt-icon pt-icon-play"></div></span>
    </Tooltip>;
  }
  renderSubtitle(): JSX.Element | string {
    if (this.state.downloading) {
      return 'Downloading...';
    }
    if (this.state.releases[this.props.album.id]) {
      if (!this.state.releases[this.props.album.id].length) {
        return <div>No results {this.renderYT()}</div>
      }
      const res = this.state.releases[this.props.album.id].map((rel) => {
        return <Tooltip content={
          <div className="release-info">
            <div className="rel-header">
              <div className="rel-name">{rel.name}</div>
            </div>
            <div className="rel-meta">
              <span className="rel-tracker">{rel.tracker}</span>

              <span className="rel-counters">
              <span className="pt-icon-caret-up"></span>
              {rel.seeders}
              <span className="pt-icon-caret-down"></span>
              {rel.leechers}</span>
            </div>
          </div>
        }>
          <span onClick={this.downloadItem.bind(this, rel._id)} className={classnames("pt-tag pt-minimal", {
          "pt-intent-warning": rel.seeders <= 2
        })}key={rel._id} >{rel.format}</span>
        </Tooltip>;
      }).concat(this.renderYT());
      return <div>
        {res}
      </div>
    }
    return '...';
  }
  async downloadItem (id: string) {
    this.setState({downloading: true});
    const res = await Session.fetch(`/api/cascade/${id}/download`, {
      method: 'POST',
      body: null,
      headers: {}
    });
    
    const data = await res.json();
  }

  loadImage(id: string, img: HTMLImageElement): void {
    this.image.src = this.props.album.cover;
  }
  
  async loadItem(id: string): Promise<void> {
    const Trackers = new PouchDB<Tracker>('trackers');
    const trackers = await Trackers.allDocs({include_docs: true});
    const album = this.props.album.name;
    const artist = this.props.album.artist;

    const res = await Promise.all(trackers.rows.map(async ({doc}) => {
      if (doc._id === '_design/validator') return [];
      const query = qs.stringify({name: album, artist});
      const res = await Session.fetch(`/api/cascade/${doc._id}/search?${query}`)
      const data = await res.json();
      return data;
    }));

    if (!res.length) {
      this.setState({releases:{
        [this.props.album.id]: []
      }});
      return;
    }

    const grouped = groupBy([].concat(...res), 'format');

    const rels = Object.keys(grouped).filter((el) => el).map((format) => {
      return grouped[format].sort((b: Release, a: Release) => {
        if (a.seeders < b.seeders) return -1;
        if (a.seeders > b.seeders) return 1;
        return 0
      })[0];
    });
    this.setState({releases:{
      [this.props.album.id]: rels
    }});
  }

  unloadItem(): void {}

  getClassNames(): string[] {
    return ['ds-album-component'];
  }
  renderHeader(): string | JSX.Element {
    return this.props.album.name;
  }
}
