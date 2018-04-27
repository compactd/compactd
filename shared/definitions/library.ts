import { IResponseDTO } from "./common";

export interface ILibrary {
  _id: string;
  name: string;
  path: string;
  added: string;
}

export enum LibraryEndpoint {
  ListDirs = "/libraries/_list_dirs"
}

export interface IListDirsReq {
  path: string;
}

export type IListDirRes = IResponseDTO<{
  dirs: Array<{
    path: string;
    name: string;
  }>;
}>;
