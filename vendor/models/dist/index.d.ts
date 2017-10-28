import { Document, RouteParams, URI } from './Definitions';
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
    _id: string;
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
export declare const artistURI: (param: string | ArtistParams) => any;
export declare const albumURI: (param: string | AlbumParams) => any;
export declare const trackURI: (param: string | TrackParams) => any;
export declare const fileURI: (param: string | FileParams) => any;
export declare const trackerURI: (param: string | TrackerParams) => any;
export declare const libraryURI: (param: string | LibraryParams) => any;
export declare const releaseURI: (param: string | ReleaseParams) => any;
export declare function mapReleaseToParams(rel: Release | ReleaseParams): ReleaseParams;
export declare function mapArtistToParams(artist: Artist | ArtistParams): ArtistParams;
export declare function mapAlbumToParams(album: Album | AlbumParams): AlbumParams;
export declare function mapTrackToParams(track: Track | TrackParams): TrackParams;
export declare function mapFileToParams(file: File): FileParams;
export declare function mapTrackerToParams(tracker: Tracker | TrackerParams): TrackerParams;
export declare function mapDownloadToParams(download: Download | DownloadParams | Partial<Download>): DownloadParams;
export declare function mapLibraryToParams(library: Library | LibraryParams): LibraryParams;
export interface DSArtist {
    type: 'artist';
    name: string;
    id: string;
    cover?: string;
    largeCover?: string;
    topAlbums?: DSAlbum[];
    similar?: DSArtist;
    bio?: string;
    _data?: {
        [name: string]: string | number;
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
        [name: string]: string | number;
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
        [name: string]: string | number;
    };
}
export declare type DSEntity = DSArtist | DSAlbum | DSTrack;
