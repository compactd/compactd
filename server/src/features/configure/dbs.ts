import * as Schemas from '../validators/Schemas';
import * as Perms from '../validators/Permissions';

export interface IDB {
  name: string;
  schema: Schemas.ISchema;
  perms: Perms.IPermissions;
}

export const dbs: IDB[] = [
  {
    name: 'artists',
    schema: Schemas.ArtistSchema,
    perms: Perms.ArtistPermissions
  }, {
    name: 'albums',
    schema: Schemas.AlbumSchema,
    perms: Perms.AlbumPermissions
  }, {
    name: 'tracks',
    schema: Schemas.TrackSchema,
    perms: Perms.TrackPermissions
  }, {
    name: 'config',
    schema: Schemas.ConfigSchema,
    perms: Perms.ConfigPermissions
  }, {
    name: 'trackers',
    schema: Schemas.TrackerSchema,
    perms: Perms.TrackerPermissions
  }, {
    name: 'releases',
    schema: Schemas.ReleaseSchema,
    perms: Perms.ReleasePermissions
  }, {
    name: 'wanted_albums',
    schema: Schemas.WantedAlbumSchema,
    perms: Perms.WantedAlbumPermission
  }
];
