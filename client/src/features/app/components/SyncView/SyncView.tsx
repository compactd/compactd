import * as React from 'react';
import {AppActions} from '../../actions.d';
import {Spinner, Classes, Intent} from '@blueprintjs/core';
import {AppState} from 'definitions';

require('./SyncView.scss');

interface SyncViewProps {
  actions: AppActions;
  app: AppState;
}

export class SyncView extends React.Component<SyncViewProps, {}>{
  componentDidMount () {
    this.props.actions.sync();
  }
  render (): JSX.Element {
    const {actions} = this.props;
    return <div className="sync-view">
      <div className="sync-spinner">
        <Spinner className={Classes.LARGE} intent={Intent.SUCCESS}
          value={this.props.app.syncingProgress || 0}/>
      </div>
    </div>
  }
}
