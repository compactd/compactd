export interface IPermission {
  [role: string]: boolean
}

export interface IPermissions {
  read: IPermission;
  update: IPermission;
  create: IPermission;
  upd_fd?: string[];
}

const any: IPermission = {
  _admin: true,
  end_user: true,
  user: true
}

const none: IPermission = {
  _admin: true,
  app: true
}

export const ArtistPermissions: IPermissions = {
  read: any,
  update: any,
  create: none,
  upd_fd: ['name']
}


export const AlbumPermissions: IPermissions = {
  read: any,
  update: any,
  create: none,
  upd_fd: ['name']
}

export const TrackerPermissions: IPermissions = {
  read: any,
  update: any,
  create: any,
  upd_fd: ['name', 'host', 'username', 'type', 'boost']
}

export const TrackPermissions: IPermissions = {
  read: any,
  update: any,
  create: none,
  upd_fd: ['name', 'track_artist', 'number']
}

export const ReleasePermissions: IPermissions = {
  read: any,
  update: none,
  create: none,
  upd_fd: []
}

export const WantedAlbumPermission: IPermissions = {
  read: any,
  update: none,
  create: none,
  upd_fd: []
}

export const ConfigPermissions: IPermissions = {
  read: any,
  update: any,
  create: any,
  upd_fd: ['value']
}
