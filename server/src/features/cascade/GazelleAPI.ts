export type GazelleReleaseType = 'Album' | 'Soundtrack' | 'EP' | 'Anthology' | 'Compilation' | 'Single' | 'Live album' | 'Remix' | 'Bootleg' | 'Interview' | 'Mixtape' | 'Demo' | 'Concert Recording' | 'DJ Mix' | 'Unknown';
export type GazelleReleaseMedia = 'CD' | 'DVD' | 'Vinyl' | 'Soundboard' | 'SACD' | 'DAT' | 'Cassette' | 'WEB' | 'Blu-Ray';
export type GazelleReleaseEncoding =  '192' | 'APS (VBR)' | 'V2 (VBR)' | 'V1 (VBR)' | '256' | 'APX (VBR)' | 'V0 (VBR)' | '320' | 'Lossless' | '24bit Lossless' | 'Other';
export type GazelleFormat = 'MP3' | 'FLAC' | 'AAC' | 'AC3' | 'DTS';

export interface GazelleEntity {

}

export interface GazelleGroup {
  groupId: number;
  groupName: string;
  artist: string;
  cover: string;
  tags: string[];
  bookmarked: boolean;
  vanityHouse: boolean;
  groupYear: number;
  releaseType: GazelleReleaseType;
  groupTime: number;
  maxSize: number;
  totalSnatched: number;
  totalSeeders: number;
  totalLeechers: number;
  torrents: GazelleTorrent[];
}

export interface GazelleTorrent {
  torrentId: number;
  editionId?: number;
  artists: {
    id: number,
    name: string,
    aliasid: number
  }[];
  remastered: boolean;
  remasterYear: number;
  remasterCatalogueNumber: string;
  remasterTitle: string;
  media: GazelleReleaseMedia;
  encoding: GazelleReleaseEncoding;
  format: GazelleFormat;
  hasLog: boolean;
  logScore: number;
  hasCue: boolean;
  scene: boolean;
  vanityHouse: boolean;
  fileCount: number;
  time: string,
  size: number;
  snatches: number;
  seeders: number;
  leechers: number;
  isFreeleech: boolean;
  isNeutralLeech: boolean;
  isPersonalFreeleech: boolean;
  canUseToken: boolean;
  hasSnatched: boolean;
}

export interface GazelleResponse<T> {
  status: 'success' | 'failure';
  response: {
    currentPage: number;
    page: number;
    results: T[]
  }
}