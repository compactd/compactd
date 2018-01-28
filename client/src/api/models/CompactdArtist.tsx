import { CompactdModel, Status, FindMode } from "api/models/CompactdModel";
import { Artist, artistURI, mapArtistToParams } from "compactd-models";
import Map from 'models/Map';
import Artwork from "api/Artwork";

export class CompactdArtist extends CompactdModel<Artist> {
  public static readonly DATABASE_NAME = "artists";

  private _changes: PouchDB.Core.Changes<Artist>;
  private _name: string;

  /**
   * Copy constructor
   * @param pouchdb the pouchdb constructor
   * @param _fetch the fetch fucntion
   * @param model the otehr model
   */
  public constructor (pouchdb: PouchDB.Static, _fetch: typeof fetch, model: CompactdArtist)
  /**
   * Constructe from props object
   * @param pouchdb 
   * @param _fetch 
   * @param props
   */
  public constructor (pouchdb: PouchDB.Static, _fetch: typeof fetch, props: Artist)
  public constructor (pouchdb: PouchDB.Static, _fetch: typeof fetch, id: string, name: string)
  public constructor (pouchdb: PouchDB.Static, _fetch: typeof fetch, id: string | Artist | CompactdArtist) {
    if (typeof id === 'string') {
      super(pouchdb, _fetch, CompactdArtist.DATABASE_NAME, id, name ?  Status.BAREBONE : Status.FETCHED);
      this._name = name;
    } else if (id instanceof CompactdArtist) {
      super(pouchdb, _fetch, CompactdArtist.DATABASE_NAME, id._id, id._status);
      this._name = id._name;
    } else if (typeof id === 'object') {
      super(pouchdb, _fetch, CompactdArtist.DATABASE_NAME, id._id, id.name ? Status.BAREBONE : Status.FETCHED);
    }
  }

  /**
   * Artist name
   */
  public get name () {
    return this._name;
  }

  public get props (): Artist {
    return {
      _id: this._id,
      name: this._name
    }
  }

  public async pull(): Promise<void> {
    const props = await this.database.get(this._id);
    
    this._name = props.name;
  }

  public loadArtworkInto (target: HTMLImageElement) {
    if (target.getBoundingClientRect().width <= 64) {
      return Artwork.getInstance(this.pouchdb).load(this._id, 'small', target);
    }
    return Artwork.getInstance(this.pouchdb).load(this._id, 'large', target);
  }

  /**
   * Find all artists
   * @param pouchDB the pouchDB constructor to use
   * @param f the fetch function to use
   * @param mode the find mode
   * @param key (optionnal) the starting key
   */
  public static async findAll (pouchDB: PouchDB.Static, f: typeof fetch, mode: FindMode, key?: string): Promise<CompactdArtist[]> {
    const artists = new pouchDB<Artist>(CompactdArtist.DATABASE_NAME);

    const items = await artists.allDocs(Object.assign({
      include_docs: mode === FindMode.PREFETCH
    }, key ? {
      startkey: key,
      endkey: key + '\uffff'
    } : {}));

    return items.rows.map(CompactdArtist.fromProps(pouchDB, f));
  }


  /**
   * Create a new artist or return one from the cache
   * @param pouchDB the pouchDB constructor to use
   * @param f the fetch function to use
   * @param id the id of the artist
   * @param name (optionnal) the name of the artist
   */
  public static get (pouchDB: PouchDB.Static, f: typeof fetch, id: string | Artist, name?: string) {
    if (typeof id !== 'string') {
      const artist = id as Artist;

      id = artist._id;
      name = artist.name;
    }
    return new CompactdArtist(pouchDB, f, id, name);
  }
  
  protected attachFeed(): void {
    if (this._changes) {
      return;
    }
    const ts = Date.now();
    this.pull().then(() => {
      this._changes = this.database.changes({
        since: ts,
        live: true,
        include_docs: true,
        doc_ids: [this._id]
      }).on('change', ({doc, deleted, id}) => {
        if (doc.name !== this._name) {
          const props = this.props;
          this._name = doc.name;
          this.fireOnPropsChanged('name', doc, props);
          return;
        }
        if (deleted) {
          this._status = Status.DELETED;
          this.fireOnDelete(id);
          return;
        }
        console.log('Unable to see change', arguments);
      })
    });
  }

  protected detachFeed(): void {
    if (this._changes) {
      this._changes.cancel();
    }
  }

  public delete(): Promise<void> {
    throw new Error("Method not implemented.");
  }

  /**
   * Creates a new database entity
   * @param pouch the database to use
   * @param _fetch the fetch function
   * @param name the name of the artist, unslugified
   */
  public static create (pouch: PouchDB.Static, _fetch: typeof fetch, name: string) {
    const db = new pouch(CompactdArtist.DATABASE_NAME);

    const _id = artistURI(mapArtistToParams({name}));

    return db.put({_id, name}).then(() => {
      return CompactdArtist.get(pouch, _fetch, _id, name);
    });
  }

  /**
   * helper function to sort by name
   * @param a 
   * @param b 
   */
  public static byNameAscending (a: {name: string}, b: {name: string}) {
    if(a.name < b.name) return -1;
    if(a.name > b.name) return 1;
    return 0;
  }

  /**
   * Helper to map artists to their props
   */
  public static toProps () {
    return (item: CompactdArtist) => {
      return item.props;
    }
  }

  /**
   * Helper to map props to artist
   * @param pouch pouchDB constructor
   * @param _fetch fethc function
   */
  public static fromProps (pouch: PouchDB.Static, _fetch: typeof fetch) {
    return (props: Artist | {doc?: Artist, id: string}) => {
      if ((props as any).id) {
        return new CompactdArtist(pouch, _fetch, (props as any).id, (props as any).doc ? (props as any).doc.name : null);
      }
      return new CompactdArtist(pouch, _fetch, props as Artist);
    }
  }
}