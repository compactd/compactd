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
  track_artist: types.string
}
