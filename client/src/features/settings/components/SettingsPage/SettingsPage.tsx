import * as React from 'react';
import {SettingsActions} from '../../actions.d';

require('./SettingsPage.scss');

interface SettingsPageProps {
  actions: SettingsActions;
}

export class SettingsPage extends React.Component<SettingsPageProps, {}>{
  render (): JSX.Element {
    const {actions} = this.props;
    return <div className="settings-page">
    </div>
  }
}