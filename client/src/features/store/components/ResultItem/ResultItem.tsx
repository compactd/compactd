import * as React from 'react';
import {StoreActions} from '../../actions.d';
import {DSEntity} from 'compactd-models';
import BetterImage from 'components/BetterImage';

require('./ResultItem.scss');

interface ResultItemProps {
  actions: StoreActions;
  item: DSEntity;
}

export class ResultItem extends React.Component<ResultItemProps, {}>{
  render (): JSX.Element {
    const {item, actions} = this.props;

    switch (item.type) {
      case 'artist':
        return <div className="result-item" onClick={() => {actions.selectDSArtist(item.id)}}>
            <BetterImage src={item.cover} className="artist-cover" size={32} />
            <span className="artist-name">{item.name}</span>
          </div>
      case 'album':
        return <div className="result-item">
            <BetterImage src={item.cover} className="album-cover" size={32} />
            <span className="album-name">{item.name}</span>
            <span className="album-artist">{item.artist}</span>
          </div>
      case 'track':
        return <div className="result-item item-track">
          <span className="track-name">{item.name}</span>
          <span className="track-artist">{item.artist}</span>
        </div>
    }
  }
}