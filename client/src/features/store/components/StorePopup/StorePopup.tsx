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
    </div>
  }
}