import * as React from 'react';
import {SettingsActions} from '../../actions.d';

require('./SettingsLink.scss');

interface SettingsLinkProps {
  actions: SettingsActions;
}

export class SettingsLink extends React.Component<SettingsLinkProps, {}>{
  render (): JSX.Element {
    const {actions} = this.props;
    return <div className="settings-link">
    </div>
  }
}