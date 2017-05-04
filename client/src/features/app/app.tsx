import * as Defs from 'definitions';
import { AppAction } from './actions.d';

const initialState: Defs.AppState = {
};

export function reducer (state: Defs.AppState = initialState,
  action: AppAction): Defs.AppState {
  switch (action.type) {
  }
  return state;
}
export const actions = {
}