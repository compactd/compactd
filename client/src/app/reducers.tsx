import {combineReducers, Reducer} from 'redux';
import {ICompactdState} from 'definitions';
import {reducer as library} from 'features/library';

export const reducers = combineReducers({
  library
}) as Reducer<ICompactdState>;
