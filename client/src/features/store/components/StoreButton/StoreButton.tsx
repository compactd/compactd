import * as React from 'react';
import {StoreActions} from '../../actions.d';
import {StoreState} from 'definitions';
import {Popover, Position} from '@blueprintjs/core';
import {StorePopup} from '../StorePopup';
import {StoreDialog} from '../StoreDialog';

require('./StoreButton.scss');

interface StoreButtonProps {
  actions: StoreActions;
  store: StoreState;
}

export class StoreButton extends React.Component<StoreButtonProps, {}>{
  render (): JSX.Element {
    const {actions, store} = this.props;
    return <div className="store-button">
      <StoreDialog actions={actions} store={store} />
      <Popover autoFocus content={<StorePopup actions={actions} />} position={Position.BOTTOM_RIGHT}>
        <span className="pt-icon pt-icon-download"></span>
      </Popover>  
    </div>
  }
}