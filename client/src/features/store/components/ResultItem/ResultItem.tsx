import * as React from 'react';
import {StoreActions} from '../../actions.d';
import {DSEntity} from 'compactd-models';
import BetterImage from 'components/BetterImage';
import { ArtistComponent, AlbumComponent } from 'components';

require('./ResultItem.scss');

interface ResultItemProps {
  actions: StoreActions;
  item: DSEntity;
}

export class ResultItem extends React.Component<ResultItemProps, {}>{
  render (): JSX.Element {
    const {item, actions} = this.props;

    switch (item.type) {
      // TODO
      case 'artist':
        return <div className="result-item" key={item.id} >
          {/* <ArtistComponent layout="compact" artist={item}  onClick={() => {actions.selectDSArtist(item.id)}}/> */}
        </div>
      case 'album':
        return <div className="result-item" key={item.id}>
          {/* <AlbumComponent layout="compact" album={item} onClick={() => {actions.selectDSAlbum(item.id)}} key={item.id}/> */}
        </div>
      case 'track':
        return <div className="result-item item-track" key={item.id} >
          <span className="track-name">{item.name}</span>
          <span className="track-artist">{item.artist}</span>
        </div>
    }
  }
}