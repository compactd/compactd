import { Document, RouteParams, URI } from './Definitions';
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
    host: string;
    username: string;
    type: string;
    boost: number;
}
export interface TrackerParams extends Document {
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
export declare const trackerURI: (param: string | FileParams) => any;
export declare const libraryURI: (param: string | FileParams) => any;
export declare function mapArtistToParams(artist: Artist | ArtistParams): ArtistParams;
export declare function mapAlbumToParams(album: Album | AlbumParams): AlbumParams;
export declare function mapTrackToParams(track: Track | TrackParams): TrackParams;
export declare function mapFileToParams(file: File): FileParams;
export declare function mapTrackerToParams(tracker: Tracker | TrackerParams): TrackerParams;
export declare function mapLibraryToParams(library: Library | LibraryParams): LibraryParams;
