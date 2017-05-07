import * as React from 'react';
import {LibraryActions} from '../../actions.d';
import {LibraryState} from 'definitions';
import ScrollableDiv from 'components/ScrollableDiv';
import {TrackListItem} from '../TrackListItem';
import {albumURI} from 'compactd-models';

require('./AlbumDetailsView.scss');

interface AlbumDetailsViewProps {
  actions: LibraryActions;
  album: string;
  artist: string;
  library: LibraryState;
}

export class AlbumDetailsView extends React.Component<AlbumDetailsViewProps, {}>{
  getAlbumId (props: AlbumDetailsViewProps = this.props) {
    return albumURI({name: props.album, artist: props.artist});
  }
  componentWillReceiveProps (nextProps: AlbumDetailsViewProps) {
    if (this.getAlbumId() !== this.getAlbumId(nextProps)) {
      this.props.actions.fetchAlbum(this.getAlbumId(nextProps));
    }
  }
  componentDidMount () {
    this.props.actions.fetchAlbum(this.getAlbumId());
  }
  render (): JSX.Element {
    const {actions, library, artist} = this.props;
    const id = this.getAlbumId();
    const album = library.albumsById[id];
    if (!album) {
      return <div className="suggestions">Suggestions</div>;
    }
    return <div className="album-details-view">
    {album.name} - {id}
    </div>
  }
}
