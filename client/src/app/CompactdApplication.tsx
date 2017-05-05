import * as React from 'react';
import { render } from "react-dom";
import { Provider } from 'react-redux';
import * as Redux from 'redux';
import { CompactdState } from 'definitions';
import { Route, Router } from 'react-router';
import { history } from './CompactdStore';
import AppView from 'features/app/components/AppView';
import {ArtistsView} from 'features/library/components/ArtistsView';
import LibraryView from 'features/library/components/LibraryView';

interface CompactdApplicationProps {
  store: Redux.Store<CompactdState>;
}
export class CompactdApplication extends
  React.Component<CompactdApplicationProps, {}> {

  render (): JSX.Element {
    return <Provider store={this.props.store}>
      <Router history={history}>
        <div>
          <AppView {...this.props}>
            <Route path="/library/artists" children={(props: any) =>
              <LibraryView component={ArtistsView} {...props}/>} />
          </AppView>
        </div>
      </Router>
    </Provider>;
  }
}
