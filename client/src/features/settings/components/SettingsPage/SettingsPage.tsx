import * as React from 'react';
import {SettingsActions} from '../../actions.d';
import {CompactdState, SettingsState} from 'definitions';
import { Tab2, Tabs2 } from "@blueprintjs/core";
import * as classnames from 'classnames';
import {TrackersView} from '../TrackersView';

require('./SettingsPage.scss');

interface SettingsPageProps {
  actions: SettingsActions;
  settings: SettingsState;
}

export class SettingsPage extends React.Component<SettingsPageProps, {}>{
  render (): JSX.Element {
    const {actions, settings} = this.props;
    return <div className={classnames("settings-page", {'settings-opened': settings.opened})}>
      <div className="close-button" onClick={() => actions.toggleSettingsPage()}>
       <span className="pt-icon-cross"></span>
      </div>
      <div className="settings-content">
        <Tabs2 id="settings" vertical className="pt-large">
          <Tab2 id="ge" title="General" panel={<span>settings</span>} />
          <Tab2 id="tr" title="Trackers" panel={<TrackersView actions={actions} settings={settings}/>} />
          <Tab2 id="lb" title="Libraries" panel={<span>libraries</span>} />
          <Tabs2.Expander />
        </Tabs2>
      </div>
    </div>
  }
}