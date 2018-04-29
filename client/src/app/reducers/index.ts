import { remoteReducer } from 'app/reducers/remote';
import { routerReducer } from 'react-router-redux';
import { combineReducers } from 'redux';
import { IRootState } from './state';

export { IRootState };

// NOTE: current type definition of Reducer in 'react-router-redux' and 'redux-actions' module
// doesn't go well with redux@4
export const rootReducer = combineReducers<IRootState>({
  remote: remoteReducer as any,
  router: routerReducer as any
});
