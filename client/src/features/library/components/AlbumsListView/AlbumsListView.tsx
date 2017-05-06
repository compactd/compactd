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
    console.log(this.props);
    if (!this.props.artist) return this.props.actions.fetchAllAlbums();
    this.props.actions.fetchArtist(this.props.artist);
  }
  render (): JSX.Element {
    const {actions, library} = this.props;
    const artist = this.props.artist ?
      library.artistsById[`library/${this.props.artist}`] : {albums: library.albums};
    const albums = artist ? artist.albums.map((album) => {
      return <AlbumListItem album={album} actions={actions} />
    }) : [];
    return <div className="albums-list-view">
      <div className="list-header">
        <div className="pt-input-group">
          <span className="pt-icon pt-icon-search"></span>
          <input className="pt-input" type="search"
            placeholder="Filter artists" dir="auto" />
        </div>
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
