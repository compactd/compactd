import * as React from 'react';
import {SettingsActions} from '../../actions.d';
import {CompactdState, SettingsState} from 'definitions';
import { Spinner, EditableText, Dialog, Button, Intent } from '@blueprintjs/core';
import * as classnames from 'classnames';

require('./LibrariesView.scss');

interface LibrariesViewProps {
  actions: SettingsActions;
  settings: SettingsState;  
}

export class LibrariesView extends React.Component<LibrariesViewProps, {editing?: string, password: string, viewPassword: boolean}> {
  passwordInput: HTMLInputElement;
  constructor() {
    super();
    this.state = {password: '', viewPassword: false};
  }
  renderLibraries() : JSX.Element {
    const {actions, settings} = this.props;
    if (settings.libraries) {
      const libraries = settings.libraries.map((library) => {
        return <tr className="library-item" key={library._id}>
          <td>{library.name}</td>
          <td>{library.path}</td>
          <td><div className="pt-button-group">
            <a className={classnames("pt-button pt-icon-refresh", {
              'pt-disabled': settings.scanning
            })}role="button" onClick={() => settings.scanning || actions.scan(library._id)}></a>
            <a className="pt-button pt-icon-delete pt-disabled" role="button"></a>
          </div></td>
        </tr>
      })
      return <div className="library-list">
        <table className="pt-table pt-interactive">
          <thead>
            <tr>
              <th>Name</th>
              <th>Path</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {libraries}
          </tbody>
        </table>
        <button type="button" className="pt-button pt-icon-add" onClick={() => actions.addTracker('New library', 'gazelle', 'username', 'redacted.ch')}>Add library</button>
      </div>
    } else {
      return <div className="loading-libraries">
        <Spinner />
      </div>
    }
  }

  componentDidMount () {
    this.props.actions.loadLibraries();
  }
  render (): JSX.Element {
    const {actions} = this.props;
    return <div className="libraries-view">
      {this.renderLibraries()}
    </div>
  }

}