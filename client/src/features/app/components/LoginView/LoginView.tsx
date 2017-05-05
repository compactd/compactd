import * as React from 'react';
import {AppActions} from '../../actions.d';
import {Button, Intent} from '@blueprintjs/core';

require('./LoginView.scss');

interface LoginViewProps {
  actions: AppActions;
}

export class LoginView extends React.Component<LoginViewProps, {}>{
  render (): JSX.Element {
    const {actions} = this.props;
    return <div className="login-view">
      <div className="login-container">
        <div className="login-header">
        Please login
        <span>Use your cassette account</span>
        </div>

        <div className="login-content">
          <input className="pt-input"
            type="text" placeholder="Username" />
          <input className="pt-input"
            type="Password" placeholder="Password" />
        </div>
        <div className="login-footer">
          <Button text="Login" intent={Intent.PRIMARY}/>
        </div>
      </div>
    </div>
  }
}
