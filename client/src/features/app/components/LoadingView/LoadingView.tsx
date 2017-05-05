import * as React from 'react';
import {AppActions} from '../../actions.d';
import {Spinner, Classes} from '@blueprintjs/core';

require('./LoadingView.scss');

interface LoadingViewProps {
  actions: AppActions;
}

export class LoadingView extends React.Component<LoadingViewProps, {}> {
  componentDidMount () {
    this.props.actions.fetchState();
  }
  render (): JSX.Element {
    const {actions} = this.props;
    return <div className="loading-view">
      <div className="loading-spinner">
        <Spinner className={Classes.LARGE} />
      </div>
    </div>
  }
}
