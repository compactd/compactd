export interface IStatusRes {
  version: string;
  flags: {
    configured: boolean;
  };
  user?: {};
}

export enum AppEndpoint {
  GetStatus = 'status'
}
