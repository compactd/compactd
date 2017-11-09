declare module 'fs-tree-diff' {

  class FSTree {
    constructor (options: {entries: FSTree.FSEntries, sortAndExpand?: boolean});
    addEntries (entries: FSTree.FSEntries, options: {sortAndExpand: boolean}): void;
    addPath (paths: string[], options: {sortAndExpand: boolean}): void;
    forEach (fn: any, context: any): void;
    calculatePatch (other: FSTree, isEqual?: (a: FSTree.FSEntry, b: FSTree.FSEntry) => boolean): FSTree.Patch;

    static fromEntries (entries: FSTree.FSEntries): FSTree;
    static fromPaths (paths: string[]): FSTree;
  }
  
  namespace FSTree {
    interface FSEntry {
      relativePath: string;
      mode: number;
      size: number;
      mtime: number;
      isDirectory: () => boolean;
    }

    type Operation = 'unlink' | 'create' | 'mkdir' | 'change' | 'rmdir';
    type PatchEntry = [Operation, string, FSEntry];
    type Patch = PatchEntry[];

    type FSEntries = FSEntry[];
  }

  export = FSTree;
}
