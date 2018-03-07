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
import { NonIdealState, Button } from '@blueprintjs/core';
import { AppError } from '../../../definitions/state';

require('./AppView.scss');

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

    if (origin) {
      actions.setOrigin(origin);
    }
  }
  componentWillReceiveProps (nextProps: AppViewProps) {
    const {origin, actions} = nextProps;

    if (origin && this.props.origin !== origin) {
      actions.resetApplication();
      actions.setOrigin(origin);
    }
  }
  renderError () {
    const {app, actions} = this.props;

    switch (app.error) {
      case AppError.FetchFailed:
        return <NonIdealState
          className="app-error-box"
          visual="offline"
          action={<Button text="Retry" iconName="refresh" onClick={() => {
            const {origin} = this.props;
            actions.resetApplication();
            actions.setOrigin(origin);
          }}/>}
          title="Unable to connect to server"
          description={`Sorry, we're unable to connect to '${app.origin}'. Maybe the host is offline or unreachable.`} />
      default:
        return <NonIdealState
          className="app-error-box"
          visual="warning-sign"
          title="An unexpected error happened"
          description="An error occured unexpectdly. Try restarting the app." />
    }
  }
  render (): JSX.Element {
    const {app, actions} = this.props;
    if (app.error) {
      return this.renderError();
    }
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
