import * as React from 'react';
import { render } from "react-dom";
import { Provider } from 'react-redux';
import * as Redux from 'redux';
import { CompactdState } from 'definitions';
import { Route } from 'react-router-dom';
import { ConnectedRouter } from 'react-router-redux';
import { history } from './CompactdStore';
import AppView from 'features/app/components/AppView';
import {ArtistsView} from 'features/library/components/ArtistsView';
import {HolisticView} from 'features/library/components/HolisticView';
import LibraryView from 'features/library/components/LibraryView';

interface CompactdApplicationProps {
  store: Redux.Store<CompactdState>;
}
export class CompactdApplication extends
  React.Component<CompactdApplicationProps, {}> {

  render (): JSX.Element {
    console.log(Route, LibraryView, HolisticView);
    return <Provider store={this.props.store}>
      <ConnectedRouter history={history}>
        <div>
          <AppView {...this.props as any}>
            <Route path="/library/:artist?" children={(props: any) =>
              <LibraryView component={HolisticView} {...props}/>} />
          </AppView>
        </div>
      </ConnectedRouter>
    </Provider>;
  }
}
