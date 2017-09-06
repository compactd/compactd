import * as React from 'react';
import { render } from 'react-dom';
import {CompactdApplication} from './CompactdApplication';
import {CompactdStore} from './CompactdStore';
import { AppContainer } from "react-hot-loader";


const compactdStore = new CompactdStore();
const store = compactdStore.configureStore();

declare global {
  interface NodeModule {
      hot: {
          accept(dependencies: string[], callback: (updatedDependencies: string[]) => void): void;
          accept(dependency: string, callback: () => void): void;
          accept(errHandler?: (err: any) => void): void;
          decline(dependencies: string[]): void;
          decline(dependency: string): void;
          decline(): void;

          dispose(callback: (data: any) => void): void;
          addDisposeHandler(callback: (data: any) => void): void;

          removeDisposeHandler(callback: (data: any) => void): void;
          // ...
      }
  }
}

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