import {
  BaseEntity,
  SlothDatabase,
  SlothEntity,
  SlothField,
  SlothRel,
  SlothURI
} from 'slothdb';

import Album from '@models/Album';
import File from '@models/File';
import Track from '@models/Track';

export interface IArtist {
  _id: string;
  name: string;
}

@SlothEntity('artists')
class ArtistEntity extends BaseEntity<IArtist> {
  @SlothURI('library', 'name')
  // tslint:disable-next-line:variable-name
  public _id: string = '';
  /**
   * Artist name
   */
  @SlothField() public name: string = '';

  @SlothRel({ hasMany: () => Album })
  public albums = () => Album;

  @SlothRel({ hasMany: () => Track })
  public tracks = () => Track;

  @SlothRel({ hasMany: () => File, cascade: false })
  public files = () => File;
}

export default new SlothDatabase<IArtist, ArtistEntity>(ArtistEntity);
