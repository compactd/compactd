export type Validator = (value: any) => string;
const types = {
  string: Object.assign(function (key: string, value: any) {
    return typeof value === 'string' ? '' : (typeof value === 'undefined' ? '' :
      'Field ' + key + ' must be a string but got a '  + typeof value);
  }, {required: function (key: string, value: any) {
    return typeof value === 'string' ? '' : (typeof value === 'undefined' ?
      'Field ' + key + ' is required' :
      'Field ' + key + ' must be a string but got a '  + typeof value);
  }}),
  number: Object.assign(function (key: string, value: any) {
    return typeof value === 'number' ? '' : (typeof value === 'undefined' ? '' :
      'Field ' + key + ' must be a number but got a '  + typeof value);
  }, {required: function (key: string, value: any) {
    return typeof value === 'number' ? '' : (typeof value === 'undefined' ?
      'Field ' + key + ' is required' :
      'Field ' + key + ' must be a number but got a '  + typeof value);
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
