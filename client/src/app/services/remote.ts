import { RemoteStatus } from 'app/reducers/state';
import { app } from 'app/services/endpoints';
import { RemoteFactory } from 'app/utils/factory';

export async function fetchStatus(factory: RemoteFactory) {
  try {
    const { flags } = await app.getStatus(factory);
    if (!flags.configured) {
      return {
        status: RemoteStatus.NotConfigured
      };
    }
    return {
      status: RemoteStatus.Ready
    };
  } catch (err) {
    if (err.status === 400) {
      return {
        status: RemoteStatus.NotSignedIn
      };
    }
    throw err;
  }
}
