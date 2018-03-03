import * as React from 'react';
import { connect } from 'react-redux';
import { bindActionCreators, Dispatch } from 'redux';
import { createStructuredSelector } from 'reselect';
import {actions} from '../app';
import {AppActions, AppAction} from '../actions.d';
import {AppState, CompactdState} from 'definitions';
import {LoadingView} from './LoadingView';
import {LoginView} from './LoginView';
import {SyncView} from './SyncView';
import { withRouter } from 'react-router-dom';

interface AppViewProps {
  actions: AppActions;
  app: AppState;
  origin: string;
}

@(connect as any)(createStructuredSelector({
  app: (state: CompactdState) => state.app
}), (dispatch: Dispatch<AppAction>) => ({
  actions: bindActionCreators(actions, dispatch)
}))
class AppView extends React.Component<AppViewProps, {}> {
  componentDidMount () {
    const {origin, actions} = this.props;
    console.log('AppView', this.props);
    if (origin) {
      actions.sync(origin);
    }
  }
  componentWillReceiveProps (nextProps: AppViewProps) {
    const {origin, actions} = nextProps;

    if (origin && nextProps.origin !== origin) {
      actions.sync(origin);
    }
  }
  render (): JSX.Element {
    const {app, actions} = this.props;
    if (app.loading) {
      return <div className="app-view">
        <LoadingView actions={actions}/>
      </div>;
    }
    if (!app.user) {
      return <div className="app-view">
        <LoginView actions={actions} />
      </div>;
    }
    if (app.user && !app.synced) {
      return <div className="app-view">
        <SyncView actions={actions} app={app}/>
      </div>;
    }
    return <div className="app-view">
      {this.props.children}
    </div>;
  }
}

export default withRouter<AppViewProps>(AppView as any);
