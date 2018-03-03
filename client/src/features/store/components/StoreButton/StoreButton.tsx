import * as React from 'react';
import {StoreActions} from '../../actions.d';
import {StoreState} from 'definitions';
import {Popover, Position} from '@blueprintjs/core';
import {StorePopup} from '../StorePopup';

require('./StoreButton.scss');

interface StoreButtonProps {
  actions: StoreActions;
  store: StoreState;
}

export class StoreButton extends React.Component<StoreButtonProps, {}>{
  render (): JSX.Element {
    const {actions, store} = this.props;
    return <div className="store-button">
      <Popover autoFocus content={<StorePopup actions={actions} store={store} />} position={Position.BOTTOM_RIGHT}>
        <span className="pt-icon pt-icon-download"></span>
      </Popover>  
    </div>
  }
}