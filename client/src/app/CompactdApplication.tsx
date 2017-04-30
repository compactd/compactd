import * as React from 'react';
import { render } from "react-dom";
import { Provider } from 'react-redux';
import * as Redux from 'redux';
import {ICompactdState} from '../definitions/state';

interface ICompactdApplicationProps {
  store: Redux.Store<ICompactdState>;
}
export class CompactdApplication extends
  React.Component<ICompactdApplicationProps, {}> {

  render (): JSX.Element {
    return <Provider store={this.props.store}>
      <div className="foobar">Hello, redux</div>
    </Provider>;
  }
}
