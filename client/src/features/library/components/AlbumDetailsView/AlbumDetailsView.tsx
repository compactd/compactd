import * as React from 'react';
import {Actions} from 'definitions/actions';
import {LibraryState, PlayerState} from 'definitions';
import ScrollableDiv from 'components/ScrollableDiv';
import {TrackListItem} from '../TrackListItem';
import {albumURI} from 'compactd-models';
import BetterImage from 'components/BetterImage';
import SuggestionsView from '../SuggestionsView';
import Artwork from 'app/Artwork';

require('./AlbumDetailsView.scss');

interface AlbumDetailsViewProps {
  actions: Actions;
  album: string;
  artist: string;
  library: LibraryState;
  player: PlayerState;
}

export class AlbumDetailsView extends React.Component<AlbumDetailsViewProps, {showHidden: boolean}>{
  constructor() {
    super();
    this.state = {showHidden: false};
  }
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
  handleClick () {
    const {actions, library, artist, player} = this.props;
    const id = this.getAlbumId();
    const album = library.albumsById[id];
    this.props.actions.replacePlayerStack(album, !this.state.showHidden);
  }
  render (): JSX.Element {
    const {actions, library, artist, player} = this.props;
    const id = this.getAlbumId();
    const album = library.albumsById[id];
    if (!album) {
      return <SuggestionsView library={library} actions={actions} />;
    }
    const p = albumURI(album._id);

    const content = album.tracks.map((track, index) => {
      const el = <TrackListItem track={track} actions={actions} library={library} key={track._id}
      playing={player.stack.length && player.stack[0]._id === track._id} playHidden={this.state.showHidden} />;
      
      if (track.hidden && !this.state.showHidden) {
        if (index > 0 && album.tracks[index - 1].hidden) return;
        return <div className="missing-track" onClick={() => {
          this.setState({showHidden: true})
        }}><div className="ellipsis">•••</div><div className="separator"></div></div>
      }
      if (track.hidden && this.state.showHidden) {
        if (index > 0 && album.tracks[index - 1].hidden) {
          return el;
        };
        return <div><div className="missing-track" onClick={() => {
          this.setState({showHidden: false})
        }}><div className="ellipsis">-</div><div className="separator"></div></div>{el}</div>
      }
      return el;
    })
    return <div className="album-details-view">
      <div className="album-header">
        <div className="album-image" onClick={this.handleClick.bind(this)}>
          <BetterImage src={Artwork.get(album._id, 'large')} size={128} />
          <span className="dark-overlay"></span>
          <span className="play-overlay pt-icon pt-icon-play"></span>
        </div>  
        <div className="album-infos">
          <div className="album-title">{album.name}</div>
          <div className="album-year">{album.year}</div>
        </div>
      </div>
      <div className="album-content">
        <ScrollableDiv offset={0} binding={album}>
          {content}
        </ScrollableDiv>
      </div>
    </div>
  }
}
