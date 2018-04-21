import {
  BaseEntity,
  belongsToMapper,
  SlothDatabase,
  SlothEntity,
  SlothField,
  SlothIndex,
  SlothRel,
  SlothURI,
  SlothView
} from 'slothdb';
import uuid from 'uuid/v1';

import Album from '@models/Album';
import Library from '@models/Library';
import ResourceType from '@models/ResourceType';

interface IFile {
  _id: string;
  path: string;
  dir: string;
  job: string;
  library: string;
  added: string;
  mtime: number;
  mimeType: string;
  resourceType: ResourceType;
  resourceID: string;
  tags?: any;
}

export enum FileIndex {
  ByAlbumTag = 'views/by_album_tag',
  ByJobId = 'views/by_job',
  ByPath = 'views/by_path',
  UnprocessedFiles = 'views/unprocessed_files'
}

@SlothEntity('files')
export class FileEntity extends BaseEntity<IFile> {
  @SlothURI('files', 'uid')
  // tslint:disable-next-line:variable-name
  public _id = '';

  @SlothField() public uid = uuid();

  @SlothIndex()
  @SlothField()
  public path = '';

  /**
   * Dirname, relative to library path
   */
  @SlothIndex()
  @SlothField()
  public dir = '';

  @SlothIndex()
  @SlothRel({ belongsTo: () => Library })
  public library = '';

  @SlothField() public added = new Date().toUTCString();

  @SlothField() public mtime = 0;

  @SlothField('mime') public mimeType = '';

  @SlothField('res_type') public resourceType = ResourceType.UNKNOWN;

  @SlothView(
    /* istanbul ignore next */ function unprocessedFiles(doc: any, emit) {
      // tslint:disable-next-line:no-unused-expression
      doc.res_id || emit(doc.mime);
    },
    'unprocessed_files'
  )
  @SlothField('res_id')
  public resourceID?;

  @SlothView<IFile>(
    /* istanbul ignore next */ function byAlbumTag(doc: any, emit) {
      if (doc.res_type === ResourceType.AUDIO && doc.tags && doc.tags.album) {
        // tslint:disable-next-line:no-unused-expression
        emit(doc.tags.album);
      }
    },
    'by_album_tag'
  )
  @SlothField()
  public tags?: any;

  public rels = {
    library: belongsToMapper(this, 'library')
  };
}

export default new SlothDatabase<IFile, FileEntity, FileIndex>(FileEntity);
