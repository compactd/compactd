import * as React from 'react';
import {PlayerActions} from '../../actions.d';
import { PlayerState } from 'definitions';
import Map from 'models/Map';
import Artwork from 'app/Artwork';
import { Link } from 'react-router-dom';

require('./CurrentPlayingView.scss');

interface CurrentPlayingViewProps {
  actions: PlayerActions;
  player: PlayerState;
}

const BLANK_IMAGE = 'data:image/png;base64,R0lGODlhFAAUAIAAAP///wAAACH5BAEAAAAALAAAAAAUABQAAAIRhI+py+0Po5y02ouz3rz7rxUAOw==';

export class CurrentPlayingView extends React.Component<CurrentPlayingViewProps, {}>{
  private div: HTMLDivElement;
  private images: Map<HTMLImageElement> = {};
  loadImage(id: string, img: HTMLImageElement): void {
    if (id) {
      Artwork.getInstance().load(id, 'large', img);
    }
  }
  
  
  attachImage (id: string) {
    if (this.images[id] && document.contains(this.images[id])) {
      return this.loadImage(id, this.images[id]);
    }
    // const size = this.div.getBoundingClientRect().wi
    const node = document.createElement('img');
    node.src = BLANK_IMAGE;
    // node.width = size;
    node.setAttribute('data-doc-id', "artworks/" + id);

    this.div.appendChild(node);
    this.loadImage(id, node);

    this.images[id] = node;
  }

  detachImage (id: string) {
    if (!id) return;
    const node = this.images[id];
    if (!node || !document.contains(node)) {
      throw new Error ('Detaching non existing node: ' + id);
    }
    this.div.removeChild(node);
  }
  componentDidMount () {
    const {actions, player} = this.props;

    window.addEventListener('resize', (evt) => {
      window.requestAnimationFrame(() => {
        this.adjustImageSize();
      })
    });
    setTimeout(() => {
      this.adjustImageSize();
    }, 200);

    if (!player.stack[0]) {
      return;
    }
    const current = player.stack[0].album;

    if (current) {
      this.attachImage(current);
    }
  }
  componentWillUnmount () {
    const {actions, player} = this.props;
    if (!player.stack[0]) return;
    
    const current = player.stack[0].album;

    if (current) {
      this.detachImage(current);
    }
  }
  componentWillReceiveProps (nextProps: CurrentPlayingViewProps) {
    const {actions, player} = this.props;

    const current = player.stack[0] ? player.stack[0].album : null;
    const next = nextProps.player.stack[0] ? nextProps.player.stack[0].album :  null;

    if (current !== next) {
      if (current) {
        this.detachImage(current);
      }
      if (next) {
        this.attachImage(next);
        actions.fetchDatabaseAlbum(next);
      }
    }

    setTimeout(() => {
      this.adjustImageSize();
    }, 100);
  } 
  get currentAlbum (): {_id: string, name: any} {
    const {actions, player} = this.props;
    const current = player.stack[0];
    if (!current) {
      return {
        _id: '', name: ''
      };
    }
    if (!player.albumsById[current.album]) {
      return {
        _id: '',
        name: <div className="pt-skeleton">artist name</div>
      };
    }
    return player.albumsById[current.album];
  }
  get currentArtist (): {_id: string, name: any}  {
    const {actions, player} = this.props;
    const current = player.stack[0];
    if (!current) {
      return {
        _id: '',
        name: ''
      }
    }
    if (!player.artistsById[current.artist]) {
      return {
        _id: '',
        name: <div className="pt-skeleton">artist name</div>
      }
    }
    return player.artistsById[current.artist];
  }
  adjustImageSize () {
    const size = window.innerWidth * (1 / 6);
    Object.keys(this.images).forEach((id) => {
      const $el = this.images[id];
      $el.width = size;
      $el.height = size;
    });
  }
  render (): JSX.Element {
    const {actions, player} = this.props;
    const current = player.stack[0];
    
    if (!current) {
      return <div className="current-playing-view">
        <div className="current-playing-info">
        </div>
        <div className="current-playing-images" ref={(ref) => this.div = ref}></div>
      </div>
    }

    return <div className="current-playing-view">
      <div className="current-playing-info">
        <a className="track-title">{current.name}</a>
        <Link to={'/' + this.currentAlbum._id} className="track-album">{this.currentAlbum.name}</Link>
        <Link to={'/' + this.currentArtist._id} className="track-artist">{this.currentArtist.name}</Link>
      </div>
      <div className="current-playing-images" ref={(ref) => this.div = ref}></div>
    </div>
  }
}