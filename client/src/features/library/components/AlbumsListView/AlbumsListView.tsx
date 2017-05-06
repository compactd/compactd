import * as React from 'react';
import {LibraryActions} from '../../actions.d';
import {LibraryState} from 'definitions';
import {AlbumListItem} from '../AlbumListItem';
import ScrollableDiv from 'components/ScrollableDiv';

require('./AlbumsListView.scss');

interface AlbumsListViewProps {
  actions: LibraryActions;
  artist: string;
  library: LibraryState
}

export class AlbumsListView extends React.Component<AlbumsListViewProps, {}>{
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
      library.artistsById[`library/${this.props.artist}`] : {name: '', albums: library.albums};

    const albums = artist ? artist.albums.map((album) => {
      return <AlbumListItem album={album} actions={actions} />
    }) : [];

    const header = this.props.artist ?
    <div className="artist-header">
      <div className="artist-image">
        <img src="http://placehold.it/32x32" />
      </div>
      <div className="artist-name">Albums by {(artist || {name: ''}).name}</div>
    </div>  : <div className="pt-input-group">
          <span className="pt-icon pt-icon-search"></span>
          <input className="pt-input" type="search"
            placeholder="Filter albums" dir="auto" />
        </div>

    return <div className="albums-list-view">
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
