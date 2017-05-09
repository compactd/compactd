import * as React from 'react';
import {Actions} from 'definitions/actions';
import {LibraryState, PlayerState} from 'definitions';
import ScrollableDiv from 'components/ScrollableDiv';
import {TrackListItem} from '../TrackListItem';
import {albumURI} from 'compactd-models';
import BetterImage from 'components/BetterImage';

require('./AlbumDetailsView.scss');

interface AlbumDetailsViewProps {
  actions: Actions;
  album: string;
  artist: string;
  library: LibraryState;
  player: PlayerState;
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
    const {actions, library, artist, player} = this.props;
    const id = this.getAlbumId();
    const album = library.albumsById[id];
    if (!album) {
      return <div className="suggestions">Suggestions</div>;
    }
    const p = albumURI(album._id);

    const content = album.tracks.map((track) =>
      <TrackListItem track={track} actions={actions} library={library}
        playing={player.stack.length && player.stack[0]._id === track._id} />)
    return <div className="album-details-view">
      <div className="album-header">
        <div className="album-image">
          <BetterImage src={`/api/aquarelle/${p.artist}/${p.name}?s=128`} size={128} />
        </div>
        <div className="album-title">{album.name}</div>
      </div>
      <div className="album-content">
        <ScrollableDiv offset={0} binding={album}>
          {content}
        </ScrollableDiv>
      </div>
    </div>
  }
}
