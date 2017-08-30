import * as React from 'react';
import {StoreActions} from '../../actions.d';

require('./StoreDialog.scss');

interface StoreDialogProps {
  actions: StoreActions;
}

export class StoreDialog extends React.Component<StoreDialogProps, {}>{
  render (): JSX.Element {
    const {actions} = this.props;
    return <div className="store-dialog">
    </div>
  }
}