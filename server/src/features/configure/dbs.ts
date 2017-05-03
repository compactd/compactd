import * as Schemas from '../validators/Schemas';
import * as Perms from '../validators/Permissions';

export interface IDB {
  name: string;
  schema: Schemas.ISchema;
  perms: Perms.IPermissions;
}

export const dbs: IDB[] = [
  {
    name: 'artist',
    schema: Schemas.ArtistSchema,
    perms: Perms.ArtistPermissions
  }, {
    name: 'album',
    schema: Schemas.AlbumSchema,
    perms: Perms.AlbumPermissions
  }, {
    name: 'track',
    schema: Schemas.TrackSchema,
    perms: Perms.TrackPermissions
  }, {
    name: 'config',
    schema: Schemas.ConfigSchema,
    perms: Perms.ConfigPermissions
  }
];
