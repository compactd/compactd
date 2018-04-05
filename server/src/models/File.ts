import {
  BaseEntity,
  belongsToMapper,
  SlothDatabase,
  SlothEntity,
  SlothField,
  SlothRel,
  SlothURI
} from 'slothdb';
import uuid from 'uuid/v1';

import Album from '@models/Album';
import Library from '@models/Library';
import ResourceType from '@models/ResourceType';

interface IFile {
  _id: string;
  path: string;
  dir: string;
  library: string;
  added: string;
  mtime: number;
  mime_type: string;
  resource: ResourceType;
  tags?: string;
}

@SlothEntity('files')
class File extends BaseEntity<IFile> {
  @SlothURI('files', 'uid')
  // tslint:disable-next-line:variable-name
  public _id = '';

  @SlothField() public uid = uuid();

  @SlothField() public path = '';

  /**
   * Dirname, relative to library path
   */
  @SlothField() public dir = '';

  @SlothRel({ belongsTo: () => Library })
  public library = '';

  @SlothField() public added = new Date().toUTCString();

  @SlothField() public mtime = 0;

  @SlothField()
  // tslint:disable-next-line:variable-name
  public mime_type = '';

  @SlothField() public resource = ResourceType.UNKNOWN;

  @SlothField() public tags?: string;

  public rels = {
    library: belongsToMapper(this, 'library')
  };
}

export default new SlothDatabase<IFile, File>(File);
