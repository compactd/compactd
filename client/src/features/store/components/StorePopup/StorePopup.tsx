import * as React from 'react';
import {StoreActions} from '../../actions.d';
import {StoreState} from 'definitions';

require('./StorePopup.scss');

interface StorePopupProps {
  actions: StoreActions;
  store: StoreState;
}

export class StorePopup extends React.Component<StorePopupProps, {}>{
  componentDidMount() {
    this.props.actions.initResults();
  }
  render (): JSX.Element {
    const {actions, store} = this.props;

    const downloads = Object.values(store.downloadsById).map((dl) => {
      if (!dl || !dl.album) return;
      return <div className="item" key={dl.id}>
          <span className="item-name">{dl.album.artist}</span>
          <span className="item-album">{dl.album.name}</span>
          <div className="pt-progress-bar pt-intent-success">
            <div className="pt-progress-meter" style={{width: dl.progress * 100 + "%"}}></div>
          </div>
        </div>
    })


    return <div className="store-popup">
      <div className="popup-content">
        <div className="popup-header" onClick={() => actions.toggleSearch()} >
          <span className="popup-title">Downloads</span>
          <span className="popup-button pt-icon-add"></span>
        </div>
        <div className="popup-main">
          {downloads}
        </div>
      </div>
    </div>
  }
}