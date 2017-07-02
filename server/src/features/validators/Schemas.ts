export type Validator = (value: any) => string;
const types = {
  string: Object.assign(function (k: string, v: any) {
    return typeof v === 'string' ? '' : (typeof v === 'undefined' ? '' :
      'Field ' + k + ' must be a string but got a '  + typeof v);
  }, {required: function (k: string, v: any) {
    return typeof v === 'string' ? '' : (typeof v === 'undefined' ?
      'Field ' + k + ' is required' :
      'Field ' + k + ' must be a string but got a '  + typeof v);
  }}),
  number: Object.assign(function (k: string, v: any) {
    return typeof v === 'number' ? '' : (typeof v === 'undefined' ? '' :
      'Field ' + k + ' must be a number but got a '  + typeof v);
  }, {required: function (k: string, v: any) {
    return typeof v === 'number' ? '' : (typeof v === 'undefined' ?
      'Field ' + k + ' is required' :
      'Field ' + k + ' must be a number but got a '  + typeof v);
  }}),
  any: function () {
    return '';
  }
}
export interface ISchema {
  [name: string]: string | ISchema | Validator;
}

export const ArtistSchema: ISchema = {
  name: types.string.required
}

export const AlbumSchema: ISchema = {
  name: types.string.required,
  artist: types.string.required,
}

export const TrackSchema: ISchema = {
  name: types.string.required,
  artist: types.string.required,
  album: types.string.required,
  number: types.number,
  disc: types.string,
  duration: types.number,
  track_artist: types.string
}

export const TrackerSchema: ISchema = {
  name: types.string.required,
  host: types.string,
  username: types.string,
  type: types.string.required,
  boost: types.number
}

export const ReleaseSchema: ISchema = {
  tracker: types.string.required,
  seeders: types.number.required,
  leechers: types.number.required,
  torrent_id: types.string.required,
  bitrate: types.number.required,
  name: types.string.required,
  wanted: types.string.required,
  format: types.string.required
}

export const WantedAlbumSchema: ISchema = {
  artist: types.string.required,
  album: types.string.required,
  strict: types.any,
  status: types.string.required
}

export const ConfigSchema: ISchema = {
  value: types.any
}
