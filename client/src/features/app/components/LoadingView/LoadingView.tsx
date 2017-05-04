import * as React from 'react';
import {AppActions} from '../../actions.d';

require('./LoadingView.scss');

interface LoadingViewProps {
  actions: AppActions;
}

export class LoadingView extends React.Component<LoadingViewProps, {}>{
  render (): JSX.Element {
    const {actions} = this.props;
    return <div className="loading-view">
    </div>
  }
}