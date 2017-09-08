import * as React from 'react';
import { connect } from 'react-redux';
import { bindActionCreators, Dispatch } from 'redux';
import { createStructuredSelector } from 'reselect';
import {actions} from '../settings';
import {SettingsActions, SettingsAction} from '../actions.d';
import {SettingsState, CompactdState} from 'definitions';

interface SettingsViewProps {
  actions: SettingsActions;
  settings: SettingsState;
}

@(connect as any)(createStructuredSelector({
  settings: (state: CompactdState) => state.settings
}), (dispatch: Dispatch<SettingsAction>) => ({
  actions: bindActionCreators(actions, dispatch)
}))
class SettingsView extends React.Component<SettingsViewProps, {}> {
  render (): JSX.Element {
    return <div className="settings-view"></div>;
  }
}

export default SettingsView as any;