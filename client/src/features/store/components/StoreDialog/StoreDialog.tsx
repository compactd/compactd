import * as React from 'react';
import {StoreActions} from '../../actions.d';
import {Dialog, Button, Intent, Spinner} from '@blueprintjs/core';
import {StoreState} from 'definitions';
import {ResultItem} from '../ResultItem';
import BetterImage from 'components/BetterImage';
import * as classnames from 'classnames'; 

require('./StoreDialog.scss');

interface StoreDialogProps {
  actions: StoreActions;
  store: StoreState;
}

export class StoreDialog extends React.Component<StoreDialogProps, {query: string}>{
  constructor () {
    super();
    this.state = {query: ''};
  }
  getDialogContent () {
    const {store, actions} = this.props;
    if (!store.search) return <div></div>;
    const results = store.searchResultsByQuery[store.search];
    if (!results)
      return <Spinner />;
    
    if (!results.artist.length && !results.album.length && !results.track.length) {
      return <div className="pt-non-ideal-state">
        <div className="pt-non-ideal-state-visual pt-non-ideal-state-icon">
          <span className="pt-icon pt-icon-cross"></span>
        </div>
        <h4 className="pt-non-ideal-state-title">No result</h4>
        <div className="pt-non-ideal-state-description">
          We couldn't find what your were looking for...
        </div>
      </div>
    }

    return <div className="results">
      <div className="artist-results">
        <span className="result-header">ARTISTS</span>
        {results.artist.map((el) => <ResultItem actions={actions} item={el} />)}
      </div>
      <div className="album-results">
        <span className="result-header">ALBUMS</span>
        {results.album.map((el) => <ResultItem actions={actions} item={el} />)}
      </div>
      <div className="result-results">
        <span className="result-header">TRACKS</span>
        {results.track.map((el) => <ResultItem actions={actions} item={el} />)}
      </div>
    </div>
  }
  renderAlbum(): JSX.Element {
    const {actions, store} = this.props;
    const album = store.albumsById[store.album];

    if(!album || !album.id)
      return <div className="loading-ds"><Spinner /></div>;

    const tracks = album.tracks.map((track) => {
      const date = new Date(null);
      date.setSeconds(track.duration || 0);
  
      const duration = date.toISOString().substr(14, 5);
      return <div className="album-track" key={track.id}>
        <span className="track-number">{track.number || ""}</span>
        <span className="track-title">{track.name}</span>
        <span className="track-duration">{duration}</span>
      </div>
    });
    return <div className="ds-album-view">
      <div className="album-list">
        <div className="current-album"><BetterImage src={album.largeCover} width={128}/></div>
      </div>
      <div className="album-content">
        <div className="album-info">
          <div className="album-title">
            {album.name}
          </div>
          <div className="album-artist">
            by {album.artist}
          </div>
        </div>
        <div className="album-items">
          {tracks}
        </div>
      </div>
    </div>;
  }
  renderArtist(): JSX.Element {
    const {actions, store} = this.props;
    const artist = store.artistsById[store.artist];
    if (!artist || !artist.id) {
      return <div className="loading-ds"><Spinner /></div>
    }
    const albums = artist.topAlbums.map((album) => {
      return <div className="album-item" key={album.id}>
        <BetterImage src={album.cover} size={32} />
        <div className="album-title" onClick={() => actions.selectDSAlbum(album.id)}>{album.name}</div>
      </div>
    });

    return <div className="ds-artist-view">
      <div className="artist-image">
        <BetterImage src={artist.largeCover} size={128} className="artist-cover" />
        <div className="artist-description">
          <div className="artist-name">{artist.name}</div>
          <div className="artist-bio" dangerouslySetInnerHTML={{__html: artist.bio}}></div>
        </div>
      </div>
      <div className="artist-albums">
        <div className="header">TOP ALBUMS</div>
        <div className="content">{albums}</div>
      </div>
    </div>
  }
  renderSearch(): JSX.Element {
    return <div className="ds-search">
      <div className="search-box">
        <div className="pt-input-group main-search-input">
          <span className="pt-icon pt-icon-search"></span>
          <input className="pt-input" type="search" placeholder="Search music" dir="auto" value={this.state.query} onChange={
            (evt) => this.setState({
              query: evt.target.value
            })
          } />
        </div>
      </div>
      <div className="dialog-content">
        {this.getDialogContent()}
      </div>
    </div>
  }
  renderResults(): JSX.Element {
    const {store, actions} = this.props;
    
    const results = store.resultsById[store.album];
    const album = store.albumsById[store.album];
    
    if (!results) {   
      return <div className="loading-ds"><Spinner /></div>
    }

    const content = results.map((res) => {
      return <div className="cascade-result" key={res._id} onClick={() => {
          actions.downloadResult(res, album)
        }}><span className="result-name">{res.name}</span> <span className="tags">
        <span className={classnames("pt-tag pt-minimal format", {
          'pt-intent-success': res.format === 'flac'
        })}>
           <span className="pt-icon pt-icon-"></span> {res.format}
        </span>
        <span className={classnames("pt-tag ", {
            'pt-intent-success': res.seeders > 4,
            'pt-intent-warning': res.seeders <= 4
          })}>
           <span className="pt-icon pt-icon-caret-up"></span> {res.seeders}
        </span>
        <span className={classnames("pt-tag ", {
          'pt-intent-warning': res.leechers / res.seeders >= 0.5,
            'pt-minimal': res.leechers === 0
        })}>
        <span className="pt-icon pt-icon-caret-down"></span> {res.leechers}
        </span>
        </span>
        </div>;
    });

    return <div className="ds-results">
      <div className="album-header">
        <BetterImage src={album.cover} size={64} />
        <div className="album-info">

          <div className="album-title" onClick={() => actions.selectDSAlbum(album.id)}>
            {album.name}
          </div>
          <div className="album-artist" onClick={() => actions.selectDSArtist(album.artist)}>
            {album.artist}
          </div>
        </div>
      </div>
      <div className="results">
        {content}
      </div>
    </div>
  }
  renderContent(): JSX.Element {
    switch (this.props.store.scope) {
      case 'artist': return this.renderArtist();
      case 'search': return this.renderSearch();
      case 'album': return this.renderAlbum();
      case 'results': return this.renderResults();
    }
  }
  renderFooter(): JSX.Element {
    const {actions, store} = this.props;
    const album = store.albumsById[store.album];

    switch (this.props.store.scope) {
      case 'artist': return <div className="footer">
        <Button text="Cancel" />
      </div>;
      case 'search': return <div className="footer">
          <Button text="Cancel" />
          <Button
            intent={Intent.PRIMARY}
            onClick={() => actions.searchDatasource(this.state.query)}
            text="Search"
          />
        </div>;
      case 'album': return <div className="footer">
        <Button text="Cancel" />
        <Button
          intent={Intent.PRIMARY}
          onClick={() => actions.loadResults(album.artist, album.name)}
          text="Download album"
        />
      </div>;
    }
  }
  render (): JSX.Element {
    const {actions, store} = this.props;
    return <div className="store-dialog">
      <Dialog iconName="search" isOpen={store.showSearchDialog} title="Download" onClose={() => actions.toggleSearch()}>
        <div className="pt-dialog-body">
          {this.renderContent()}
        </div>
        <div className="pt-dialog-footer">
          <div className="pt-dialog-footer-actions">
            {this.renderFooter()}
          </div>
        </div>
      </Dialog>
    </div>
  }
}