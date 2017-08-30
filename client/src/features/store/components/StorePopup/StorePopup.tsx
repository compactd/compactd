import * as React from 'react';
import {StoreActions} from '../../actions.d';

require('./StorePopup.scss');

interface StorePopupProps {
  actions: StoreActions;
}

export class StorePopup extends React.Component<StorePopupProps, {}>{
  render (): JSX.Element {
    const {actions} = this.props;
    return <div className="store-popup">
      <div className="popup-content">
        <div className="popup-header" onClick={() => actions.toggleSearch()} >
          <span className="popup-title">Downloads</span>
          <span className="popup-button pt-icon-add"></span>
        </div>
        <div className="popup-main">
          <div className="item">
            <span className="item-name">KillASon</span>
            <span className="item-album">The Ryze</span>
            <div className="pt-progress-bar pt-intent-success">
              <div className="pt-progress-meter" style={{width: "75%"}}></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  }
}