import {
  BaseEntity,
  belongsToMapper,
  SlothDatabase,
  SlothEntity,
  SlothField,
  SlothRel,
  SlothURI
} from "slothdb";

import { ILibrary } from "../definitions/library";
import File from "./File";

@SlothEntity("libraries")
class Library extends BaseEntity<ILibrary> {
  @SlothURI("libraries", "name")
  // tslint:disable-next-line:variable-name
  public _id = "";

  @SlothField() public name = "";

  @SlothField() public path = "";

  @SlothField() public added = new Date().toJSON();

  // @SlothRel({ hasMany: () => File })
  // public files?: () => File;
}

export default new SlothDatabase<ILibrary, Library>(Library);
