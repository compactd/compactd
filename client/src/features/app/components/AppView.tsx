import * as React from 'react';
import { connect } from 'react-redux';
import { bindActionCreators, Dispatch } from 'redux';
import { createStructuredSelector } from 'reselect';
import {actions} from '../app';
import {AppActions, AppAction} from '../actions.d';
import {AppState, CompactdState} from 'definitions';

interface AppViewProps {
  actions: AppActions;
  app: AppState;
}

@(connect as any)(createStructuredSelector({
  app: (state: CompactdState) => state.app
}), (dispatch: Dispatch<AppAction>) => ({
  actions: bindActionCreators(actions, dispatch)
}))
class AppView extends React.Component<AppViewProps, {}> {
  render (): JSX.Element {
    return <div className="app-view"></div>;
  }
}

export default AppView as any;