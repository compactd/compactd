import {combineReducers, Reducer} from 'redux';
import {CompactdState} from 'definitions';
import {reducer as library} from 'features/library';
import {reducer as app} from 'features/app';
import { routerReducer, routerMiddleware } from 'react-router-redux'

export const reducers = combineReducers({
  router: routerReducer,
  library, app
}) as Reducer<CompactdState>;
