import { CompactdModel, Status, FindMode } from "api/models/CompactdModel";
import { Album, albumURI, mapAlbumToParams } from "compactd-models";
import Map from 'models/Map';
import Artwork from "api/Artwork";
import { CompactdArtist } from "api/models/CompactdArtist";

export class CompactdAlbum extends CompactdModel<Album> {
  public static readonly DATABASE_NAME = "albums";

  private _changes: PouchDB.Core.Changes<Album>;
  private _name: string;
  private _artist: CompactdArtist;
  private _dateAdded: number;
  private _year: number;

  /**
   * Copy constructor
   * @param pouchdb the pouchdb constructor
   * @param _fetch the fetch fucntion
   * @param model the otehr model
   */
  public constructor (pouchdb: PouchDB.Static, _fetch: typeof fetch, model: CompactdAlbum)
  /**
   * Constructe from props object
   * @param pouchdb 
   * @param _fetch 
   * @param props
   */
  public constructor (pouchdb: PouchDB.Static, _fetch: typeof fetch, props: Album)
  public constructor (pouchdb: PouchDB.Static, _fetch: typeof fetch, id: string)
  public constructor (pouchdb: PouchDB.Static, _fetch: typeof fetch, id: string | Album | CompactdAlbum) {
    if (id instanceof CompactdAlbum) {
      super(pouchdb, _fetch, CompactdAlbum.DATABASE_NAME, id._id, id._status);
      this._name      = id._name;
      this._artist    = new CompactdArtist(pouchdb, _fetch, id._artist);
      this._dateAdded = id._dateAdded;
      this._year      = id._year;
    } else if (typeof id === 'object') {
      super(pouchdb, _fetch, CompactdAlbum.DATABASE_NAME, id._id, Status.PREFETCHED);
      this._name        = id.name;
      this._artist    = new CompactdArtist(pouchdb, _fetch, id.artist);
      this._dateAdded = id.dateAdded;
      this._year      = id.year;
    } else {
      super(pouchdb, _fetch, CompactdAlbum.DATABASE_NAME, id, Status.BAREBONE);
    }
  }
  public getRevision () {
    return this.database.get(this._id).then((doc) => doc._rev);
  }
  /**
   * Album name
   */
  public get name () {
    return this._name;
  }

  public get year () {
    return this._year;
  }
  
  /**
   * Copies the artist
   */
  public getArtist () {
    return new CompactdArtist(this.pouchdb, this._fetch, this._artist);
  }

  public get props (): Album {
    return {
      _id: this._id,
      name: this._name,
      artist: this._artist.id,
      dateAdded: this._dateAdded,
      year: this._year
    }
  }


  public async pull(): Promise<void> {
    const props = await this.database.get(this._id);
    
    this._name = props.name;

    return this._artist.fetch();
  }

  public loadArtworkInto (target: HTMLImageElement) {
    if (target.getBoundingClientRect().width <= 64) {
      return Artwork.getInstance(this.pouchdb).load(this._id, 'small', target);
    }
    return Artwork.getInstance(this.pouchdb).load(this._id, 'large', target);
  }

  /**
   * Find all albums
   * @param pouchDB the pouchDB constructor to use
   * @param f the fetch function to use
   * @param mode the find mode
   * @param key (optionnal) the starting key
   */
  public static async findAll (pouchDB: PouchDB.Static, f: typeof fetch, mode: FindMode, key?: string): Promise<CompactdAlbum[]> {
    const albums = new pouchDB<Album>(CompactdAlbum.DATABASE_NAME);

    const items = await albums.allDocs(Object.assign({
      include_docs: mode === FindMode.PREFETCH
    }, key ? {
      startkey: key,
      endkey: key + '\uffff'
    } : {}));

    return items.rows.map(CompactdAlbum.fromProps(pouchDB, f));
  }
  
  protected attachFeed(): void {
    if (this._changes) {
      return;
    }
    this._changes = this.database.changes({
      since: 'now',
      live: true,
      include_docs: true,
      doc_ids: [this._id]
    }).on('change', ({doc, deleted, id}) => {
      if (deleted) {
        this._status = Status.DELETED;
        this.fireOnDelete(id);
        return;
      }

      if (doc.name !== this._name) {
        const props = this.props;
        this._name = doc.name;
        this.fireOnPropsChanged('name', doc, props);
        return;
      }

      if (doc.year !== this._year) {
        const props = this.props;
        this._year = doc.year;
        this.fireOnPropsChanged('year', doc, props);
        return;
      }

      if (doc.artist !== this._artist.id) {
        const props = this.props;
        this._artist = new CompactdArtist(this.pouchdb, this._fetch, doc.artist);
        this.fireOnPropsChanged('artist', doc, props);
        return;
      }
      
      console.log('Unable to see change', arguments);
    })
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
   * @param name the name of the album, unslugified
   */
  public static create (pouch: PouchDB.Static, _fetch: typeof fetch, name: string) {
    const db = new pouch(CompactdAlbum.DATABASE_NAME);

    const _id = albumURI(mapAlbumToParams({name}));

    return db.put({_id, name}).then(() => {
      return new CompactdAlbum(pouch, _fetch, _id, name);
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
   * Helper to map albums to their props
   */
  public static toProps () {
    return (item: CompactdAlbum) => {
      return item.props;
    }
  }

  /**
   * Helper to map props to album
   * @param pouch pouchDB constructor
   * @param _fetch fethc function
   */
  public static fromProps (pouch: PouchDB.Static, _fetch: typeof fetch) {
    return (props: Album | {doc?: Album, id: string}) => {
      if ((props as any).id) {
        return new CompactdAlbum(pouch, _fetch, (props as any).id, (props as any).doc ? (props as any).doc.name : null);
      }
      return new CompactdAlbum(pouch, _fetch, props as Album);
    }
  }
}