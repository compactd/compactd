import * as React from 'react';
import {AppActions} from '../../actions.d';

require('./LoginView.scss');

interface LoginViewProps {
  actions: AppActions;
}

export class LoginView extends React.Component<LoginViewProps, {}>{
  render (): JSX.Element {
    const {actions} = this.props;
    return <div className="login-view">
    </div>
  }
}