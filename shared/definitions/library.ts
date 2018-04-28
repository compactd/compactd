import JobStatus from 'shared/constants/JobStatus';
import { IJob } from 'shared/definitions/jobs';

export interface ILibrary {
  _id: string;
  name: string;
  path: string;
  added: string;
}

export enum LibraryEndpoint {
  ListDirs = '/libraries/_list_dirs',
  Libraries = '/libraries',
  LibraryScans = '/libraries/:id/scans'
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
  library: ILibrary;
}

export interface ILibraryScansParams {
  id: string;
}

export interface ILibraryScansQuery {
  status: JobStatus;
}

export interface ICreateLibraryResponse {
  job: IJob;
}

export interface IFindLibraryScansResponse {
  jobs: IJob[];
}
