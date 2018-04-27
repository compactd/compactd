import {
  BaseEntity,
  belongsToMapper,
  SlothDatabase,
  SlothEntity,
  SlothField,
  SlothRel,
  SlothURI
} from 'slothdb';

import Album from '@models/Album';
import File from '@models/File';

export interface ITrack {
  _id: string;
  username: string;
  hash: string;
}

@SlothEntity('tracks')
class Track extends BaseEntity<ITrack> {
  @SlothURI<ITrack>('library', 'username')
  // tslint:disable-next-line:variable-name
  public _id = '';

  @SlothField() public username = '';

  @SlothField() public hash = '';
}

export default new SlothDatabase<ITrack, Track>(Track);
