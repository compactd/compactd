"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const sha1 = require("sha1");
const docuri = require('docuri');
const slug = require('slug');
function getRoute() {
    return docuri;
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
};
exports.artistURI = getRoute().route(routes.artist);
exports.albumURI = getRoute().route(routes.album);
exports.trackURI = getRoute().route(routes.track);
exports.fileURI = getRoute().route(routes.file);
exports.trackerURI = getRoute().route(routes.tracker);
exports.libraryURI = getRoute().route(routes.library);
exports.releaseURI = getRoute().route(routes.release);
function mapReleaseToParams(rel) {
    return {
        wanted: rel.wanted,
        format: rel.format,
        tracker: rel.tracker,
        torrent_id: rel.torrent_id
    };
}
exports.mapReleaseToParams = mapReleaseToParams;
function mapArtistToParams(artist) {
    return {
        name: slug(artist.name).toLowerCase()
    };
}
exports.mapArtistToParams = mapArtistToParams;
function mapAlbumToParams(album) {
    return {
        name: slug(album.name).toLowerCase(),
        artist: exports.artistURI(album.artist).name
    };
}
exports.mapAlbumToParams = mapAlbumToParams;
function mapTrackToParams(track) {
    return {
        name: slug(track.name).toLowerCase(),
        artist: exports.artistURI(track.artist).name,
        album: exports.albumURI(track.album).name,
        number: (track.disc || 0) + '.' + (track.number <= 9 ? `0${track.number}` : `${track.number}`)
    };
}
exports.mapTrackToParams = mapTrackToParams;
function mapFileToParams(file) {
    return {
        artist: exports.artistURI(file.artist).name,
        album: exports.albumURI(file.album).name,
        track: exports.trackURI(file.track).name,
        number: exports.trackURI(file.track).number,
        bitrate: `0000${file.bitrate}`.slice(-4),
        hash: sha1(file.path).slice(6)
    };
}
exports.mapFileToParams = mapFileToParams;
function mapTrackerToParams(tracker) {
    return {
        name: slug(tracker.name),
        type: tracker.type
    };
}
exports.mapTrackerToParams = mapTrackerToParams;
function mapDownloadToParams(download) {
    return {
        album: download.album,
        artist: download.artist,
        torrent_id: download.torrent_id
    };
}
exports.mapDownloadToParams = mapDownloadToParams;
function mapLibraryToParams(library) {
    return {
        name: slug(library.name)
    };
}
exports.mapLibraryToParams = mapLibraryToParams;
