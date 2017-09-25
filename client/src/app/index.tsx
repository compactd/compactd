import * as React from 'react';
import { render } from 'react-dom';
import {CompactdApplication} from './CompactdApplication';
import {CompactdStore} from './CompactdStore';
import { AppContainer } from "react-hot-loader";


const compactdStore = new CompactdStore();
const store = compactdStore.configureStore();

const rootEl = document.getElementById("compactd-root");
render(
  <AppContainer>
    <CompactdApplication store={store} />
  </AppContainer>,
  rootEl
);

if (module.hot) {
  module.hot.accept('./CompactdApplication', () => { 
    const NextApp: typeof CompactdApplication = require("./CompactdApplication").CompactdApplication;
    render(
      <AppContainer>
        <NextApp store={store} />
      </AppContainer>
      , rootEl
    );
  });
  
}