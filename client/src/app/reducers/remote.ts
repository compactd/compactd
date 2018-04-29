import { RemoteActionType } from 'app/actions/remote';
import { handleActions } from 'redux-actions';
import { IRemoteState, RemoteStatus } from './state';

const initialState: IRemoteState = {
  dirs: {},
  status: RemoteStatus.Loading
};

export const remoteReducer = handleActions<IRemoteState, any>(
  {
    [RemoteActionType.Login]: (state, { payload }) => {
      if (payload && payload.token) {
        return {
          ...state,
          token: payload.token
        };
      } else {
        return state;
      }
    },
    [RemoteActionType.ResolveStatus]: (state, action) => {
      if ('payload' in action) {
        if (!action.payload) {
          return state;
        }
        return { ...state, status: action.payload.status };
      }
      return state;
    }
  },
  initialState
);
