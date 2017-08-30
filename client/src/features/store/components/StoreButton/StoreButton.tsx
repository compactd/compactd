import * as React from 'react';
import {StoreActions} from '../../actions.d';

require('./StoreButton.scss');

interface StoreButtonProps {
  actions: StoreActions;
}

export class StoreButton extends React.Component<StoreButtonProps, {}>{
  render (): JSX.Element {
    const {actions} = this.props;
    return <div className="store-button">
    </div>
  }
}