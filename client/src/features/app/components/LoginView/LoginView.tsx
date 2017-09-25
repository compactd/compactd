import * as React from 'react';
import {AppActions} from '../../actions.d';
import {Button, Intent} from '@blueprintjs/core';
import * as classnames from 'classnames';

require('./LoginView.scss');

interface LoginViewProps {
  actions: AppActions;
}

interface LoginViewState {
  username: string;
  password: string;
  active: boolean;
}

export class LoginView extends React.Component<LoginViewProps, LoginViewState> {
  constructor () {
    super();
    this.state = {
      username: '',
      password: '',
      active: false
    };
  }
  handleClick () {
    this.props.actions.login(this.state.username, this.state.password);
  }
  handleUsernameChange (event: Event) {
    const target = event.target as HTMLInputElement;
    this.setState({
      username: target.value
    });
  }
  handlePasswordChange (event: Event) {
    const target = event.target as HTMLInputElement;
    this.setState({
      password: target.value
    });
  }
  componentDidMount () {
    setTimeout(() => {
      this.setState({active: true});
    }, 150);
  }
  render (): JSX.Element {
    const {actions} = this.props;
    return <div className="login-view">
      <div className={classnames("login-container", {
          active: this.state.active
        })}>
        <div className="login-header">
        Please login
        <span>Use your cassette account</span>
        </div>

        <div className="login-content">
          <input className="pt-input" value={this.state.username}
            onChange={this.handleUsernameChange.bind(this)}
            onKeyPress={(evt) => evt.key === 'Enter' && this.handleClick()}
            type="text" placeholder="Username" />
          <input className="pt-input" value={this.state.password}
            onChange={this.handlePasswordChange.bind(this)}
            onKeyPress={(evt) => evt.key === 'Enter' && this.handleClick()}
            type="Password" placeholder="Password" />
        </div>
        <div className="login-footer">
          <Button text="Login" intent={Intent.PRIMARY}
            onClick={this.handleClick.bind(this)}/>
        </div>
      </div>
    </div>
  }
}
