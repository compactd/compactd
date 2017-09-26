/// <reference types="node" />


import * as React from 'react';
import { render } from "react-dom";
import { Provider } from 'react-redux';
import * as Redux from 'redux';
import { CompactdState } from 'definitions';
import { Route, Switch} from 'react-router-dom';
import { ConnectedRouter } from 'react-router-redux';
import { history } from './CompactdStore';
import AppView from 'features/app/components/AppView';
import {ArtistsView} from 'features/library/components/ArtistsView';
import {HolisticView} from 'features/library/components/HolisticView';
import LibraryView from 'features/library/components/LibraryView';
import PlayerView from 'features/player/components/PlayerView';
import {PlaylistView} from 'features/player/components/PlaylistView';
import {PlayerStatus} from 'features/player/components/PlayerStatus';
import Sandbox from 'components/Sandbox';

const {Flex, Box} = require('reflexbox');
require('../styles/base.scss');

interface CompactdApplicationProps {
  store: Redux.Store<CompactdState>;
}

const doNothing = (...args: any[]) =>{
  return console.log(args);
}

export class CompactdApplication extends
  React.Component<CompactdApplicationProps, {}> {

  render (): JSX.Element {
    console.log(ConnectedRouter);
    // Inexplicable bug where i need to log these avoid undefined errors
    doNothing(Route, LibraryView, HolisticView, PlayerView, PlaylistView, PlayerStatus, Sandbox);

    return (<Provider store={this.props.store}>
      <ConnectedRouter history={history}>
        <AppView {...this.props as any}>
          <PlayerView component={PlayerStatus} />
          <Flex>
            <Box col={10}>
              <Switch>
                <Route path="/library/all/:artist?/:album?" children={(props: any) =>
                  <LibraryView component={HolisticView} all={true} {...props}/>} />
                <Route path="/library/:artist?/:album?" children={(props: any) =>
                  <LibraryView component={HolisticView} {...props}/>} />
                <Route path="/sandbox" children={(props: any) =>
                  <Sandbox {...props}/>} />
              </Switch>
            </Box>
            <Box col={2} style={{
              /* zIndex: 25, */
              backgroundColor: '#fff',
              boxShadow: '0 0 4px rgba(0, 0, 0, 0.2)',
              padding: '0.4em'
            }}>
              <PlayerView component={PlaylistView} />
            </Box>
          </Flex>
          </AppView>
      </ConnectedRouter>
    </Provider>);
  }
}
