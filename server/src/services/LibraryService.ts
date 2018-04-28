import { Component, Inject } from '@nestjs/common';
import { lstat, readdir } from 'mz/fs';
import { join, resolve } from 'path';
import { PouchFactory } from 'slothdb';

import DepToken from 'shared/constants/DepToken';
import {
  ACCESS_DENIED,
  INVALID_BODY_PARAMETER
} from 'shared/constants/httpErrors';

import Debug from 'debug';
import { ICreateLibraryPayload } from 'shared/definitions/library';
import Library from 'shared/models/Library';

const debug = Debug('compactd:library');

const UNSAFE_ROOTS = [
  'root',
  'lib',
  'lib64',
  'run',
  'etc',
  'dev',
  'proc',
  'sys',
  'bin',
  'sbin',
  'usr',
  'var',
  'boot'
];

@Component()
export default class LibraryService {
  constructor(
    @Inject(DepToken.DatabaseFactory)
    private readonly factory: PouchFactory<any>
  ) {}
  public async createLibrary({ name, path }: ICreateLibraryPayload) {
    const lib = await Library.put(this.factory, {
      name,
      path: this.resolveDir(path)
    });

    return lib.getProps();
  }
  public getLibraries() {
    return Library.findAllDocs(this.factory);
  }

  public async listDirs(dir: string) {
    const path = this.resolveDir(dir);
    debug('listDirs("%s")', dir);

    const dirs = await readdir(path);

    const mappedDirs = await Promise.all(
      dirs.map(async name => [
        (await lstat(join(path, name))).isDirectory(),
        name
      ])
    );

    return mappedDirs.filter(([flag]) => flag).map(([flag, item]) => {
      return {
        name: item as string,
        path: join(path, item as string)
      };
    });
  }

  private resolveDir(dir: string): string {
    if (dir === '' || !dir.startsWith('/')) {
      throw INVALID_BODY_PARAMETER;
    }
    const path = resolve(dir);
    const [empty, root] = path.split('/');
    if (empty !== '' || !root) {
      throw INVALID_BODY_PARAMETER;
    }
    if (UNSAFE_ROOTS.includes(root)) {
      throw ACCESS_DENIED;
    }
    return path;
  }
}
