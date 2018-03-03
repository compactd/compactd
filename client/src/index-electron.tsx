
import * as ReactDOM from 'react-dom';
import * as React from 'react';
import {URL} from 'url';
import session from 'app/session';
import {CompactdStore} from 'app/CompactdStore';
import {ElectronContainer} from './renderer/container';

const compactdStore = new CompactdStore();
const store = compactdStore.configureStore();
ReactDOM.render(
  <ElectronContainer store={store} />,
  document.getElementById('root')
)