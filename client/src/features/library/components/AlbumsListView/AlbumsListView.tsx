import * as React from 'react';
import {LibraryActions} from '../../actions.d';
import {LibraryState} from 'definitions';
import {AlbumListItem} from '../AlbumListItem';
import ScrollableDiv from 'components/ScrollableDiv';
import {Album, albumURI, artistURI} from 'compactd-models';
import * as fuzzy from 'fuzzy';
import {match} from 'react-router';
import {BetterImage, ArtistComponent} from 'components';
import {EventEmitter} from 'eventemitter3';
import * as objectHash from 'object-hash';
import PlaceholderComponent from 'components/PlaceholderComponent';

require('./AlbumsListView.scss');

interface AlbumsListViewProps {
  actions: LibraryActions;
  artist: string;
  library: LibraryState;
  all: boolean;
  match: match<{artist?: string, album?: string}>;
}

export class AlbumsListView extends React.Component<AlbumsListViewProps, {
  albumsFilter: string;
}>{
  private oldScroll: [number, number];
  private hash: string;
  private div: HTMLDivElement;
  private emitter: EventEmitter;
  constructor () {
    super();
    this.state = {albumsFilter: ''};
    this.emitter = new EventEmitter();
  }
  handleAlbumsFilterChange (evt: Event) {
    const target = evt.target as HTMLInputElement;
    this.setState({albumsFilter: target.value});
  }
  componentDidMount () {
    if (!this.props.artist) {
      this.props.actions.fetchAllAlbums();
    } else {
      this.props.actions.fetchArtist(this.props.artist);
    }

    const div = this.div;

    this.oldScroll = this.computeRange(div);

    div.addEventListener('scroll', (event) => {
      window.requestAnimationFrame(() => {
        const id = this.hash;

        const [oldStart, oldEnd] = this.oldScroll;
        const [start, end] = this.computeRange(div);

        if (start === oldStart) return;

        if (start > oldStart) {
          this.emitHideRange(id, oldStart, start);
        } else {
          this.emitHideRange(id, end, oldEnd);
        }

        if (start > oldStart) {
          this.emitShowRange(id, oldEnd, end);
        } else {
          this.emitShowRange(id, start, oldStart);
        }
        
        this.oldScroll = [start, end];
      })
    });
  }
  handleArtistDivRef(id: string, div: HTMLDivElement) {
    this.div = div;
  }
  private emitShowRange(id: string, start: number, end: number) {
    for (let i = start ; i < end ; i++) {
      this.emitter.emit(`show-${id}-${i}`);
    }
  }
  private emitHideRange(id: string, start: number, end: number) {
    for (let i = start ; i < end ; i++) {
      this.emitter.emit(`hide-${id}-${i}`);
    }
  }
  componentWillReceiveProps (nextProps: AlbumsListViewProps) {

    if (nextProps.artist !== this.props.artist) {
      if (!nextProps.artist) return this.props.actions.fetchAllAlbums();
      this.props.actions.fetchArtist(nextProps.artist);
    }
    const {actions, library} = this.props;
    const artistId = `library/${this.props.artist}`;

    const artist = this.props.artist ?
    (library.artistsById[artistId]
      || {_id: '', name: '', albums: []}) : {_id: '', name: '', albums: library.albums};

    const hash = objectHash({
      artist: nextProps.artist,
      albums: artist.albums.length
    });

    if (this.hash !== hash) {
      this.hash = hash;
      this.oldScroll = this.computeRange(this.div);
    }
  }
  private computeRange(div: HTMLDivElement): [number, number] {
    const top = div.scrollTop;
    const height = div.getBoundingClientRect().height;
    const childHeight = 80;
    const length = Math.ceil((height) / childHeight);
    const start = Math.floor(top / childHeight);
    const end = start + length;
    
    return [start, end];
  }

  render (): JSX.Element {
    const {actions, library} = this.props;
    const artistId = `library/${this.props.artist}`;
    const artist = this.props.artist ?
      (library.artistsById[artistId]
        || {_id: '', name: '', albums: []}) : {_id: '', name: '', albums: library.albums};

    const albums = artist.albums.map((album, index) => {
      return  <AlbumListItem key={album}
                active={this.props.match.params.album === albumURI(album).name}
                album={album} actions={actions} all={this.props.all}
                hash={this.hash}
                emitter={this.emitter}
                index={index}
                visible={index < this.oldScroll[1] + 1}/>
    }).concat(<PlaceholderComponent id="" layout="medium" theme="dark"/>);
    
    const header = (this.props.artist && artist) ?
        <div className="artist-header">
          <ArtistComponent layout="compact" id={artistId} theme="dark" />
        </div>  : <div className="pt-input-group">
          <span className="pt-icon pt-icon-search"></span>
          <input className="pt-input" type="search"
            onChange={this.handleAlbumsFilterChange.bind(this)}
            value={this.state.albumsFilter}
            placeholder="Filter albums" dir="auto" />
        </div>

    return <div className="albums-list-view pt-dark">
      <div className="list-header">
        {header}
      </div>
      <ScrollableDiv divRef={(div) => this.div = div}>
        <div className="albums-container">
          {albums}
        </div>
      </ScrollableDiv>
    </div>
  }
}


  // value={this.state.artistsFilter}
  // onChange={this.handleArtistsFilterChange.bind(this)}
