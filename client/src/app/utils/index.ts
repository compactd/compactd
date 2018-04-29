import { IRootState } from 'app/reducers';
import { IRemoteState } from 'app/reducers/state';
import { RemoteFactory, RemoteFactoryType } from 'app/utils/factory';
import * as urljoin from 'url-join';

export function omit<T extends object, K extends keyof T>(
  target: T,
  ...omitKeys: K[]
): Omit<T, K> {
  return (Object.keys(target) as K[]).reduce(
    (res, key) => {
      if (!omitKeys.includes(key)) {
        res[key] = target[key];
      }
      return res;
    },
    // tslint:disable-next-line:no-object-literal-type-assertion
    {} as Omit<T, K>
  );
}

export interface IDict<T> {
  [name: string]: T;
}

export function createEndpointAction<
  T extends (factory: RemoteFactory, ...args: any[]) => Promise<any>
>(func: T, type: string): T {
  return ((factory: RemoteFactory, ...args: any[]) => {
    return async (dispatch: any, getState: () => IRootState) => {
      dispatch({
        type
      });
      dispatch({
        payload: await func(factory, ...args),
        type
      });
    };
  }) as any;
}

export function getFactoryFromState(state: IRemoteState): RemoteFactory {
  return (type, id) => {
    switch (type) {
      case RemoteFactoryType.Header:
        return state.token ? `Bearer ${state.token}` : '';
      case RemoteFactoryType.Http:
        return urljoin(window.location.origin, id);
      default:
        return '';
    }
  };
}
