export interface SerializedFSEntry {
  relPath: string;
  mode: number;
  size: number;
  mtime: number;
  dir: boolean;
}
