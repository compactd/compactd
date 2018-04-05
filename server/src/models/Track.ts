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

interface ITrack {
  _id: string;
  name: string;
  artist: string;
  track_artist: string;
  album: string;
  added: string;
  file: string;
  duration: number;
  number: number;
  disc: string;
  position: string;
}

@SlothEntity('tracks')
class Track extends BaseEntity<ITrack> {
  @SlothURI<ITrack>('library', 'album', 'position', 'name')
  // tslint:disable-next-line:variable-name
  public _id = '';

  @SlothField() public name = '';

  @SlothRel({ belongsTo: () => Album })
  public artist = '';

  @SlothField()
  // tslint:disable-next-line:variable-name
  public track_artist = '';

  @SlothRel({ belongsTo: () => Album })
  public album = '';

  @SlothField() public added = new Date().toUTCString();

  @SlothRel({ belongsTo: () => File })
  public file = '';

  @SlothField() public number = 1;

  /**
   * Duration in seconds
   */
  @SlothField() public duration = 0;

  /**
   * Disc number
   */
  @SlothField() public disc = '0';

  /**
   * <disc[#]>.<number[##]>
   */
  @SlothField() public position = '0.01';

  public rels = {
    album: belongsToMapper(this, 'album'),
    artist: belongsToMapper(this, 'artist')
  };

  @SlothRel({ hasMany: () => File, cascade: false })
  public files = () => File;
}

export default new SlothDatabase<ITrack, Track>(Track);
