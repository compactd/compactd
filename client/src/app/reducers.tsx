import {combineReducers, Reducer} from 'redux';
import {CompactdState} from 'definitions';
import {reducer as library} from 'features/library';
import { routerReducer, routerMiddleware } from 'react-router-redux'

export const reducers = combineReducers({
  router: routerReducer,
  library
}) as Reducer<CompactdState>;
