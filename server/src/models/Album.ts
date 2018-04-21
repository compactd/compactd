import {
  BaseEntity,
  belongsToMapper,
  SlothDatabase,
  SlothEntity,
  SlothField,
  SlothRel,
  SlothURI
} from 'slothdb';

import Artist from '@models/Artist';
import File from '@models/File';
import Track from '@models/Track';

export interface IAlbum {
  _id: string;
  name: string;
  artist: string;
  added: string;
}

@SlothEntity('albums')
class Album extends BaseEntity<IAlbum> {
  public rels = {
    artist: belongsToMapper(this, 'artist')
  };

  @SlothURI<IAlbum>('library', 'artist', 'name')
  // tslint:disable-next-line:variable-name
  public _id = '';

  @SlothField() public name = '';

  @SlothRel({ belongsTo: () => Artist, cascade: true })
  public artist = '';

  @SlothField() public added = new Date().toUTCString();

  @SlothRel({ hasMany: () => Track })
  public tracks = () => Track;

  @SlothRel({ hasMany: () => File, cascade: false })
  public files = () => File;
}

export default new SlothDatabase<IAlbum, Album>(Album);
