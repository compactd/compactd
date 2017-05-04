import * as React from 'react';
import { render } from "react-dom";
import { Provider } from 'react-redux';
import * as Redux from 'redux';
import { CompactdState } from 'definitions';
import { Route, Router } from 'react-router';
import { history } from './CompactdStore';
import LibraryView from 'features/library/components/LibraryView';
// import LibraryView from 'features/library/components/LibraryView';

interface CompactdApplicationProps {
  store: Redux.Store<CompactdState>;
}
export class CompactdApplication extends
  React.Component<CompactdApplicationProps, {}> {

  render (): JSX.Element {
    console.log(LibraryView, Router)
    return <Provider store={this.props.store}>
      <Router history={history}>
        <div>
          <Route exact path="/" component={LibraryView}/>
        </div>
      </Router>
    </Provider>;
  }
}
