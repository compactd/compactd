export enum RemoteFactoryType {
  Pouch,
  Http,
  Header
}

export type RemoteFactory = (type: RemoteFactoryType, id: string) => string;
