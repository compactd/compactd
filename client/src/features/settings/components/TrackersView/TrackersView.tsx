import * as React from 'react';
import {SettingsActions} from '../../actions.d';
import {CompactdState, SettingsState} from 'definitions';
import { Spinner, EditableText, Dialog, Button, Intent } from '@blueprintjs/core';
import * as classnames from 'classnames';

require('./TrackersView.scss');

interface TrackersViewProps {
  actions: SettingsActions;
  settings: SettingsState;  
}

export class TrackersView extends React.Component<TrackersViewProps, {editing?: string, password: string, viewPassword: boolean}> {
  passwordInput: HTMLInputElement;
  constructor() {
    super();
    this.state = {password: '', viewPassword: false};
  }
  toggleDialog() {
    const {actions, settings} = this.props;
    const {editing, password} = this.state;

    actions.editTrackerPassword(editing, password);
    this.setState({editing: undefined});
  }
  editTrackerPassword(editing: string) {
    if (this.passwordInput) {
      this.passwordInput.value = "";
    }
    this.setState({editing, viewPassword: false});
  }
  renderTrackers() : JSX.Element {
    const {actions, settings} = this.props;
    const {editing, password, viewPassword} = this.state;
    if (settings.trackers) {
      const trackers = settings.trackers.map((tracker) => {
        return <tr className="tracker-item" key={tracker._id}>
          <td><EditableText defaultValue={tracker.name} onConfirm={(name) => actions.editTracker(tracker._id, {name})} /></td>
          <td>{tracker.type}</td>
          <td><EditableText defaultValue={tracker.username} onConfirm={(username) => actions.editTracker(tracker._id, {username})} /></td>
          <td><EditableText defaultValue={tracker.host} onConfirm={(host) => actions.editTracker(tracker._id, {host})} /></td>
          <td><div className="pt-button-group">
            <a className="pt-button pt-icon-asterisk" role="button" onClick={() => this.editTrackerPassword(tracker._id)}></a>
            <a className="pt-button pt-icon-delete" role="button"></a>
          </div></td>
        </tr>
      })
      return <div className="tracker-list">
        {this.renderPasswordDialog(editing, viewPassword, password)}
        <table className="pt-table pt-interactive">
          <thead>
            <tr>
              <th>Name</th>
              <th>Type</th>
              <th>Username</th>
              <th>Host</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {trackers}
          </tbody>
        </table>
        <button type="button" className="pt-button pt-icon-add" onClick={() => actions.addTracker('New tracker', 'gazelle', 'username', 'redacted.ch')}>Add tracker</button>
      </div>
    } else {
      return <div className="loading-trackers">
        <Spinner />
      </div>
    }
  }

  componentDidMount () {
    this.props.actions.loadTrackers();
  }
  render (): JSX.Element {
    const {actions} = this.props;
    return <div className="trackers-view">
      {this.renderTrackers()}
    </div>
  }

  private renderPasswordDialog(editing: string, viewPassword: boolean, password: string) {
    return <Dialog isOpen={!!editing} iconName="asterisk" onClose={() => this.setState({ editing: null }) } title="Edit password" style={{ width: '500px' }}>
        <div className="pt-dialog-body">
          Please note for security reasons, password are stored outside of compactd database, in the system files. Only the backend server should be able to read the password when it needs to search trackers.
          <div className="pt-input-group">
            <input ref={(ref) => {this.passwordInput = ref; }} type={viewPassword ? "text": "password"} className="pt-input" value={password} onChange={(evt) => this.setState({ password: evt.target.value }) } placeholder="Enter your password..."/>
            <button className={classnames("pt-button pt-minimal pt-intent-warning", {
              'pt-icon-eye-open': !viewPassword,
              'pt-icon-eye-off': viewPassword,
             }) } onClick={() => this.setState({ viewPassword: !viewPassword }) }></button>
           </div>
          </div>
        <div className="pt-dialog-footer">
          <div className="pt-dialog-footer-actions">
            <Button text="Cancel" onClick={() => this.setState({ editing: null }) }/>
            <Button intent={Intent.PRIMARY} onClick={this.toggleDialog.bind(this) } text="Change"/>
          </div>
        </div>
      </Dialog>;
    }
}