import SplashProxy from 'app/containers/splash/SplashProxy';
import * as React from 'react';
import { hot } from 'react-hot-loader';
import { Route, Switch } from 'react-router';

export const App = hot(module)(() => (
  <Switch>
    <Route path="/" component={SplashProxy} />
  </Switch>
));
