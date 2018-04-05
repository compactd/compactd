import {
  BaseEntity,
  belongsToMapper,
  SlothDatabase,
  SlothEntity,
  SlothField,
  SlothRel,
  SlothURI
} from 'slothdb';

import File from '@models/File';

interface ILibrary {
  _id: string;
  name: string;
  path: string;
  added: string;
}

@SlothEntity('libraries')
class Library extends BaseEntity<ILibrary> {
  @SlothURI('libraries', 'name')
  // tslint:disable-next-line:variable-name
  public _id = '';

  @SlothField() public name = '';

  @SlothField() public path = '';

  @SlothField() public added = new Date().toUTCString();

  @SlothRel({ hasMany: () => File })
  public files = () => File;
}

export default new SlothDatabase(Library);
