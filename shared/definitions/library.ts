export interface ILibrary {
  _id: string;
  name: string;
  path: string;
  added: string;
}

export enum LibraryEndpoint {
  ListDirs = "/libraries/_list_dirs",
  CreateLibrary = "/libraries",
  ListLibraries = "/libraries"
}

export interface IListDirsReq {
  path: string;
}

export interface IListDirRes {
  dirs: Array<{
    path: string;
    name: string;
  }>;
}

export interface ICreateLibraryPayload {
  name: string;
  path: string;
}

export interface ICreateLibraryResponse {
  libraries: ILibrary;
}
