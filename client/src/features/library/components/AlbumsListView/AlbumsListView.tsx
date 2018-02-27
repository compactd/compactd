import * as React from 'react';
import {LibraryActions} from '../../actions.d';
import {LibraryState} from 'definitions';
import {AlbumListItem} from '../AlbumListItem';
import ScrollableDiv from 'components/ScrollableDiv';
import {Album, albumURI, artistURI, DSAlbum, mapAlbumToParams} from 'compactd-models';
import * as fuzzy from 'fuzzy';
import {match} from 'react-router';
import {BetterImage, ArtistComponent} from 'components';
import {EventEmitter} from 'eventemitter3';
import * as objectHash from 'object-hash';
import PlaceholderComponent from 'components/PlaceholderComponent';
import Map from 'models/Map';
import Session from 'app/session';
import Toaster from 'app/toaster';
import DSAlbumComponent from 'components/DSAlbumComponent/DSAlbumComponent';
import { filter } from 'fuzzaldrin';
import { ListProps } from 'react-virtualized';
import AlbumComponent from 'components/AlbumComponent/AlbumComponent';
import { join } from 'path';
import { parse, stringify } from 'querystring';
import { List } from 'react-virtualized/dist/es/List';
import * as PropTypes from 'prop-types';
import { Link } from 'react-router-dom';
import { DownloadComponent } from 'components/DownloadComponent/DownloadComponent';
import LibraryProvider from 'app/LibraryProvider';
import * as slug from 'slug';

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
  displayResults: boolean;
  height?: number;
  width?: number;
}>{
  private changes: PouchDB.Core.Changes<{}>;
  static contextTypes = {
    router: PropTypes.shape({
      history: PropTypes.shape({
        push: PropTypes.func.isRequired,
        replace: PropTypes.func.isRequired,
        createHref: PropTypes.func.isRequired
      }).isRequired
    }).isRequired
  }
  private div: HTMLDivElement;
  constructor () {
    super();
    this.state = {albumsFilter: '', displayResults: false};
  }
  handleAlbumsFilterChange (evt: Event) {
    const target = evt.target as HTMLInputElement;
    this.setState({albumsFilter: target.value});
  }
  handleSearchClick() {
    this.setState({displayResults: true});

    const {actions, library} = this.props;
    const artistId = `library/${this.props.artist}`;

    const artist = this.props.artist ?
      (library.artistsById[artistId]
        || {_id: '', name: ''}) : {_id: '', name: ''};

    this.props.actions.searchDSStore(artist);
  }
  componentDidMount () {
    const artistId = `library/${this.props.artist}`;

    this.props.actions.watchDownloads();
    if (!this.props.artist) {
      this.props.actions.fetchAllAlbums();
    } else {
      this.props.actions.fetchArtist(this.props.artist);
    }
    this.changes = LibraryProvider.getInstance().onDocAdded('albums', (id) => {
      if (id.startsWith(artistId)) {
        this.props.actions.fetchArtist(this.props.artist);
      }
    })
    window.addEventListener('resize', this.onResize);
  }
  onResize () {
    window.requestAnimationFrame(() => {
      this.computeHeight(this.div);
    })
  }
  componentWillUnmount () {
    window.removeEventListener('resize', this.onResize);
    this.changes.cancel();
  }
  handleArtistDivRef(id: string, div: HTMLDivElement) {
    this.div = div;
  }
  componentWillReceiveProps (nextProps: AlbumsListViewProps) {

    if (nextProps.artist !== this.props.artist) {
      if (!nextProps.artist) return this.props.actions.fetchAllAlbums();
      this.props.actions.fetchArtist(nextProps.artist);
      this.setState({
        displayResults: false
      });
    }
  }

  computeHeight (div: HTMLDivElement) {
    if (!div) return;
    const windowHeight = Math.max(document.documentElement.clientHeight, window.innerHeight || 0);
    const {top, width} = div.getBoundingClientRect();

    if (top === 0 || width === 0) return;

    const height = windowHeight - top;

    if (height === this.state.height && width === this.state.width) {
      return;
    }

    this.setState({
      height, width
    });
  }
  get albums () {
    const {actions, library} = this.props;
    const artistId = `library/${this.props.artist}`;

    if (this.props.artist) {
      if (library.artistsById[artistId]) {
        return library.artistsById[artistId].albums
          .concat((library.downloadsByArtist[artistId] || []).filter(({name}) => {
            return !library.artistsById[artistId].albums.includes(artistId + '/' + slug(name, {lower: true}));
          }).map((el) => el._id));
      } else {
        return [];
      }
    }
    return library.albums;
  }
  get items () {
    const {library} = this.props;
    const artistId = `library/${this.props.artist}`;
    if (this.props.artist) {
      const artist = library.artistsById[artistId];
      const dsResults = this.props.library.dsResultsById[artistId];

      if (!this.state.displayResults) {
        return this.albums.concat('?search-albums');
      }
      
      if (dsResults) {
        return this.albums.concat(dsResults.filter((val, i) => {
          const uri = albumURI(mapAlbumToParams({artist: artist._id, name: val.name}));
          if (artist.albums.includes(uri)) {
            return false;
          }
          return !(library.downloadsByArtist[artistId] || []).find((el) => {
            return el._id.startsWith(uri.replace(/^library/, 'downloads'));
          });
        }).slice(0, 20).map((res) => {
          return 'results?' + stringify(res);
        }));
      } else {
        return this.albums.concat('?searching-albums');
      }
    }
    return filter(this.albums, this.state.albumsFilter);
  }
  renderItem (props: ListProps) {
    return <div style={props.style} key={props.key} >
        {this._renderItem(props)}
      </div>
  }
  handleAlbumClick (album: string, active: boolean, event: MouseEvent) {
    if (
      !event.defaultPrevented && // onClick prevented default
      event.button === 0// && // ignore right clicks
    //  !this.props.target //&& // let browser handle "target=_blank" etc.
      // !isModifiedEvent(event) // ignore clicks with modifier keys
    ) {
      event.preventDefault()

      const { history } = this.context.router
      const props = albumURI(album);
      history.push(active ? '/library' : `/library/${
        this.props.all ? 'all/':  ''}${
        props.artist
      }/${props.name}`);
    }

  }
  
  _renderItem (props: ListProps) {
    const {index, style, parent} = props;
    const {artist} = this.props;
    const artistId = `library/${artist}`;
    const item = this.items[index];
    if (item.startsWith('library/')) {
      const active = this.props.match.params.album === albumURI(item).name;
      return <AlbumComponent
              id={item}
              onClick={this.handleAlbumClick.bind(this, item, active)}
              active={active}
              layout="medium"
              theme="dark"
              subtitle="counters" />
    } else if (item.startsWith('downloads/')) {

      const dl = this.props.library.downloadsByArtist[artistId].find((el) => el._id === item);
      return <DownloadComponent id={item} name={dl.name} layout="medium" theme="dark" progress={dl.progress} /> 
    } else if (item === '?searching-albums') {
      return <PlaceholderComponent id="" layout="medium" theme="dark" loading={true} />;
    } else if (item === '?search-albums') {
      return <PlaceholderComponent id="" layout="medium" theme="dark" loading={false} onClick={this.handleSearchClick.bind(this)}/>;
    } else if (item.startsWith('results?')) {
      const [pre, ...res] = item.split('?');
      const active = this.props.match.params.album === parse(res[0]).name
      
      return <DSAlbumComponent layout="medium" id={item} theme="dark" album={parse(res.join('?')) as any} onClick={() => {
        const url = `/library/${artist}/store/${parse(res[0]).name}`
        const { history } = this.context.router;
        history.push(url);
      }} active={active} />
    }
  }
  
  render (): JSX.Element {
    const {actions, library} = this.props;
    const artistId = `library/${this.props.artist}`;
    const artist = this.props.artist ?
      (library.artistsById[artistId]
        || {_id: '', name: '', albums: []}) : {_id: '', name: '', albums: library.albums};
        

    const albums = this.items;
    
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
        <div className="top-gradient"></div>
        <div className="scroll-container" ref={(ref) => {
          this.div = ref;
          this.computeHeight(ref);
        }}>
          <List
            __filter={this.state.albumsFilter}
            height={this.state.height}
            width={this.state.width} 
            rowHeight={80} 
            rowCount={albums.length}
            rowRenderer={this.renderItem.bind(this)} />
        </div>
    </div>
  }
}


  // value={this.state.artistsFilter}
  // onChange={this.handleArtistsFilterChange.bind(this)}
