import {Store, applyMiddleware, compose, createStore} from 'redux';
import {CompactdState} from 'definitions';
import {reducers} from './reducers';
import createHistory from 'history/createBrowserHistory'
import * as reduxPromise from 'redux-promise';
import reduxThunk from 'redux-thunk';
import { routerMiddleware } from 'react-router-redux'
// Create a history of your choosing (we're using a browser history in this case)
export const history = createHistory()

// Build the middleware for intercepting and dispatching navigation actions
const middleware = routerMiddleware(history)

export class CompactdStore {
  compose: typeof compose;
  constructor () {
    this.compose = (window as any).__REDUX_DEVTOOLS_EXTENSION_COMPOSE__ || compose;
  }
  configureStore (): Store<CompactdState> {
    const enhancer = this.compose(
      applyMiddleware(middleware, reduxThunk, reduxPromise)
    )(createStore);
    return enhancer(reducers);
  }
}
