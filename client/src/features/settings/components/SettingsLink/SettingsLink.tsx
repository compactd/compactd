import * as React from 'react';
import {SettingsActions, SettingsAction} from '../../actions.d';
import { connect } from 'react-redux';
import { bindActionCreators, Dispatch } from 'redux';
import { createStructuredSelector } from 'reselect';
import {actions} from '../../settings';
import {SettingsPage} from '../SettingsPage';
import {CompactdState, SettingsState} from 'definitions';

require('./SettingsLink.scss');

interface SettingsLinkProps {
  actions: SettingsActions;
  settings: SettingsState;
}

@(connect as any)(createStructuredSelector({
  settings: (state: CompactdState) => state.settings
}), (dispatch: Dispatch<SettingsAction>) => ({
  actions: bindActionCreators(actions, dispatch)
}))
class SettingsLink extends React.Component<SettingsLinkProps, {}> {
  render (): JSX.Element {
    const {actions, settings} = this.props;
    return <div className="settings-link">
      <span className="pt-icon pt-icon-cog" onClick={() => actions.toggleSettingsPage()}></span>
      <SettingsPage actions={actions} settings={settings}/>
    </div>
  }
}

export default SettingsLink as any;