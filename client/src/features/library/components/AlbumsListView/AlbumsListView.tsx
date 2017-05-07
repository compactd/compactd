import * as React from 'react';
import {LibraryActions} from '../../actions.d';
import {LibraryState} from 'definitions';
import {AlbumListItem} from '../AlbumListItem';
import ScrollableDiv from 'components/ScrollableDiv';
import {Album, albumURI} from 'compactd-models';
import * as fuzzy from 'fuzzy';
import {match} from 'react-router';

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
  constructor () {
    super();
    this.state = {albumsFilter: ''};
  }
  handleAlbumsFilterChange (evt: Event) {
    const target = evt.target as HTMLInputElement;
    this.setState({albumsFilter: target.value});
  }
  componentWillReceiveProps (nextProps: AlbumsListViewProps) {
    if (nextProps.artist !== this.props.artist) {
      if (!nextProps.artist) return this.props.actions.fetchAllAlbums();
      this.props.actions.fetchArtist(nextProps.artist);
    }
  }
  componentDidMount () {
    if (!this.props.artist) return this.props.actions.fetchAllAlbums();
    this.props.actions.fetchArtist(this.props.artist);
  }
  render (): JSX.Element {
    const {actions, library} = this.props;
    const artist = this.props.artist ?
      (library.artistsById[`library/${this.props.artist}`]
        || {name: '', albums: []}) : {name: '', albums: library.albums};

    const options = {
      pre: '$', post: '',
      extract: (el: Album) => el.name
    };
    const albums = artist.albums
    .map(album => {
      if (this.state.albumsFilter && !this.props.artist) {
        return [
          fuzzy.match(this.state.albumsFilter, album.name, options), album
        ]
      }
      return [undefined, album];
    }).filter(([matched, album]: [fuzzy.MatchResult, Album]) => {
      return this.state.albumsFilter && !this.props.artist ? matched : true;
    }).sort((a, b) => {
      if (!this.state.albumsFilter || this.props.artist) {
        if ((a[1] as Album).name > (b[1] as Album).name) return 1;
        if ((a[1] as Album).name < (b[1] as Album).name) return -1;
        return 0;
      }
      return (b[0] as fuzzy.MatchResult).score - (a[0] as fuzzy.MatchResult).score;
    }).map(([matched, album]: [fuzzy.MatchResult, Album]) => {
      return  <AlbumListItem key={album._id} filterMatch={matched}
                active={this.props.match.params.album === albumURI(album._id).name}
                album={album} actions={actions} all={this.props.all}/>
    })

    const header = this.props.artist ?
    <div className="artist-header">
      <div className="artist-image">
        <img src="http://placehold.it/32x32" />
      </div>
      <div className="artist-name">Albums by {(artist || {name: ''}).name}</div>
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
      <ScrollableDiv>
        <div className="albums-container">
          {albums}
        </div>
      </ScrollableDiv>
    </div>
  }
}


  // value={this.state.artistsFilter}
  // onChange={this.handleArtistsFilterChange.bind(this)}
