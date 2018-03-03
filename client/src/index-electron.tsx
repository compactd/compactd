
import * as ReactDOM from 'react-dom';
import * as React from 'react';
import { TitleBar } from 'electron/TitleBar/TitleBar';
import {URL} from 'url';
import session from 'app/session';
import { CompactdApplication } from 'app/CompactdApplication';
import {CompactdStore} from 'app/CompactdStore';

const origin = new URL('http://localhost:9000/');
const compactdStore = new CompactdStore();
const store = compactdStore.configureStore();


ReactDOM.render(
  <div>
    <TitleBar origin={origin} />
    <CompactdApplication store={store} origin={origin.toString()}/>
  </div>,
  document.getElementById('root')
)