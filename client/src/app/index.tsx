import * as React from 'react';
import { render } from 'react-dom';
import {CompactdApplication} from './CompactdApplication';
import {CompactdStore} from './CompactdStore';

const compactdStore = new CompactdStore();
const store = compactdStore.configureStore();

render(
  <CompactdApplication store={store} />,
  document.getElementById("compactd-root")
);
