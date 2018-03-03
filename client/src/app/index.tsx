import * as React from 'react';
import { render } from 'react-dom';
import {CompactdApplication} from './CompactdApplication';
import {CompactdStore} from './CompactdStore';
import { AppContainer } from "react-hot-loader";


const compactdStore = new CompactdStore();
const store = compactdStore.configureStore();

const rootEl = document.getElementById("root");
render(
  <AppContainer>
    <CompactdApplication store={store} origin={window.location.origin} />
  </AppContainer>,
  rootEl
);
