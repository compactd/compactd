import { RemoteFactory, RemoteFactoryType } from 'app/utils/factory';
import { compile } from 'path-to-regexp';
import { AppEndpoint, IStatusRes } from 'shared/definitions/status';
import * as urljoin from 'url-join';
import wretch from 'wretch';
import { ResponseChain } from 'wretch/dist/resolver';

function createGetEndpoint<Res, Params = undefined, Query = undefined>(
  uri: string
): Params extends undefined
  ? Query extends undefined
    ? (factory: RemoteFactory) => Promise<Res> & ResponseChain
    : (factory: RemoteFactory, params: Params) => Promise<Res> & ResponseChain
  : (
      factory: RemoteFactory,
      params: Params,
      query: Query
    ) => Promise<Res> & ResponseChain {
  const toPath = compile(uri);
  return (async (factory: RemoteFactory, params?: Params, query?: Query) => {
    const url = toPath(params);
    const origin = factory(RemoteFactoryType.Http, urljoin('/api/', url));

    const req = await wretch(origin)
      .headers({
        authorization: factory(RemoteFactoryType.Header, 'authorization')
      })
      .query((query as any) || {})
      .get();
    return req.json();
  }) as any;
}

export const app = {
  getStatus: createGetEndpoint<IStatusRes>(AppEndpoint.GetStatus)
};
