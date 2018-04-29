import { fetchStatus } from 'app/services/remote';
import { createEndpointAction } from 'app/utils';

export enum RemoteActionType {
  Login = 'compactd/remote/LOGIN',
  Logout = 'compactd/remote/LOGOUT',
  ResolveStatus = 'compactd/remote/RESOLVE_STATUS',
  ResolveDirectory = 'compactd/remote/RESOLVE_DIRECTORY'
}

export const remoteActions = {
  fetchStatus: createEndpointAction(
    fetchStatus,
    RemoteActionType.ResolveStatus
  ),
  login: (username: string, password: string) => {
    throw new Error('Not implemented');
  },
  setToken: (token: string) => {
    return {
      payload: { token },
      type: RemoteActionType.Login
    };
  }
};
