import {DocURI, Document, RouteParams, URI, RouteFactory} from './Definitions';
import sha1 = require('sha1');

const docuri = require('docuri');
const slug = require('slug') as (str: string) => string;

function getRoute <T extends RouteParams> (): DocURI<T> {
  return (docuri as DocURI<T>);
}

const routes = {
  artist: 'library/:name',
  album: 'library/:artist/:name',
  track: 'library/:artist/:album/:number/:name',
  file: 'library/:artist/:album/:number/:track/:bitrate/:hash',
  tracker: 'trackers/:type/:name',
  download: 'downloads/:artist/:album/:torrent_id',
  library: 'config/library/:name',
  release: ':wanted/:format/:tracker/:torrent_id'
}
export interface Download extends Document {
  _id: string;
  artist: string;
  album: string;
  torrent_id: string | number;
  tracker: string;
  progress: number;
  cover_url?: string;
}

export interface DownloadParams extends RouteParams {
  artist: string;
  album: string;
  torrent_id: string | number;
}

export interface Library extends Document {
  _id: string;
  name: string;
  path: string;
  last_scan?: number;
}

export interface LibraryParams extends RouteParams {
  name: string;
}

export interface Tracker extends Document {
  _id: string;
  name: string;
  host?: string;
  username: string;
  type: string;
  boost?: number;
}

export interface UnscoredRelease extends Document {
  _id: string
  tracker: string;
  seeders: number;
  leechers: number;
  torrent_id: string;
  bitrate: string;
  name: string;
  wanted: string;
  format: string;
} 

export interface Release extends UnscoredRelease {
  score: number;
}

export interface ReleaseParams extends RouteParams {
  wanted: string;
  format: string;
  tracker: string;
  torrent_id: string;
}

export interface TrackerParams extends RouteParams {
  type: string;
  name: string;
}

export interface Artist extends Document {
  _id: string;
  name: string;
}

export interface ArtistParams extends RouteParams {
  name: string;
}


export interface Album extends Document {
  _id: string;
  name: string;
  artist: string;
}

export interface AlbumParams extends RouteParams {
  name: string;
  artist: URI<ArtistParams>;
}

export interface Track extends Document {
  _id: string;
  name: string;
  artist: string;
  album: string;
  number: number;
  duration: number;
  disc: string;
  hidden?: boolean;
}

export interface TrackParams extends RouteParams {
  name: string;
  artist: URI<ArtistParams>;
  album: URI<AlbumParams>;
  number: string;
}

export interface File extends Document {
  _id: string;
  artist: string;
  album: string;
  track: string;
  library: string;
  duration: number;
  format: string;
  bitrate: string;
  hash: string;
  path: string;
}

export interface FileParams extends RouteParams {
  artist: URI<ArtistParams>;
  album: URI<AlbumParams>;
  track: URI<TrackParams>;
  hash: string;
  bitrate: string;
}

export const artistURI = getRoute<ArtistParams>().route(routes.artist);
export const albumURI = getRoute<AlbumParams>().route(routes.album);
export const trackURI = getRoute<TrackParams>().route(routes.track);
export const fileURI = getRoute<FileParams>().route(routes.file);
export const trackerURI = getRoute<TrackerParams>().route(routes.tracker);
export const libraryURI = getRoute<LibraryParams>().route(routes.library);
export const releaseURI = getRoute<ReleaseParams>().route(routes.release);

export function mapReleaseToParams (rel: Release | ReleaseParams): ReleaseParams {
  return {
    wanted: rel.wanted,
    format: rel.format,
    tracker: rel.tracker,
    torrent_id: rel.torrent_id
  }
}

export function mapArtistToParams (artist: Artist | ArtistParams): ArtistParams {
  return {
    name: slug(artist.name).toLowerCase()
  };
}

export function mapAlbumToParams (album: Album | AlbumParams): AlbumParams {
  return {
    name: slug(album.name).toLowerCase(),
    artist: artistURI(album.artist).name
  };
}

export function mapTrackToParams (track: Track | TrackParams): TrackParams {
  return {
    name: slug(track.name).toLowerCase(),
    artist: artistURI(track.artist).name,
    album: albumURI(track.album).name,
    number: track.number <= 9 ? `0${track.number}` : `${track.number}`
  };
}

export function mapFileToParams (file: File): FileParams {
  return {
    artist: artistURI(file.artist).name,
    album: albumURI(file.album).name,
    track: trackURI(file.track).name,
    number: trackURI(file.track).number,
    bitrate: `0000${file.bitrate}`.slice(-4),
    hash: sha1(file.path).slice(6) as string
  };
}

export function mapTrackerToParams (tracker: Tracker | TrackerParams) : TrackerParams {
  return {
    name: slug(tracker.name),
    type: tracker.type
  };
}

export function mapDownloadToParams (download: Download | DownloadParams | Partial<Download>): DownloadParams {
  return {
    album: download.album,
    artist: download.artist,
    torrent_id: download.torrent_id
  }
}

export function mapLibraryToParams (library: Library | LibraryParams) : LibraryParams {
  return  {
    name: slug(library.name)
  };
}


export interface DSArtist {
  type: 'artist';
  name: string;
  id: string;
  cover?: string;
  largeCover?: string;
  topAlbums?: DSAlbum[];
  similar?: DSArtist;
  bio?: string;
  _data?:  {
    [name: string]: string | number
  };
}

export interface DSAlbum {
  type: 'album';
  name: string;
  id: string;
  artist: string;
  cover?: string;
  largeCover?: string;
  tracks?: DSTrack[];
  year?: string;
  _data?: {
    [name: string]: string | number
  };
}

export interface DSTrack {
  type: 'track';
  name: string;
  id: string;
  artist: string;
  album?: string;
  number?: number;
  duration?: number;
  _data?: {
    [name: string]: string | number
  };
}

export type DSEntity = DSArtist | DSAlbum | DSTrack;