import {Store, applyMiddleware, compose, createStore} from 'redux';
import {ICompactdState} from 'definitions';
import {reducers} from './reducers';
import * as reduxPromise from 'redux-promise';

export class CompactdStore {
  compose: typeof compose;
  constructor () {
    this.compose = (window as any).__REDUX_DEVTOOLS_EXTENSION_COMPOSE__ || compose;
  }
  configureStore (): Store<ICompactdState> {
    const enhancer = this.compose(
      applyMiddleware(reduxPromise)
    )(createStore);
    return enhancer(reducers);
  }
}
