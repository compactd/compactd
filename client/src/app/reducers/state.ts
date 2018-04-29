import { IDict } from 'app/utils';
import { RouterState } from 'react-router-redux';

export enum RemoteStatus {
  Loading,
  NotConfigured,
  NotSignedIn,
  Ready
}

export interface IRemoteState {
  status: RemoteStatus;
  token?: string;
  dirs: IDict<Array<{ name: string; path: string }>>;
}

export interface IRootState {
  remote: IRemoteState;
  router: RouterState;
}
