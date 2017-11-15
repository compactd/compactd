import PouchDB from 'pouchdb';

export default class Artwork {
  private blobCache: {
    [id: string]: [number, Promise<string>]
  } = {};

  private artworks: PouchDB.Database<{}>;
  private static sInstance: Artwork;

  private PouchDB: PouchDB.Static;
  private constructor (pouch: typeof PouchDB) {
    this.PouchDB = pouch;
    this.artworks = new pouch('artworks');
  }

  getLargeCover (id: string, size = 64) {
    const entryId = id + '!large';
    if (!this.blobCache[entryId]) {
      const url = this.get(id, 'large')
        .then((blob) => URL.createObjectURL(blob));
      this.blobCache[entryId] = [1, url];
      return url;
    }
    return this.blobCache[entryId][1];
  }

  getSmallCover (id: string, size = 32) {
    const entryId = id + '!small';

    if (!this.blobCache[entryId]) {
      const url = this.get(id, 'small')
        .then((blob) => URL.createObjectURL(blob));
      this.blobCache[entryId] = [1, url];
      return url;
    }
    return this.blobCache[entryId][1];
  }

  increaseCacheLocks (id: string, size: 'large' | 'small') {
    const entryId = id + '!' + size;
    
    if (!this.blobCache[entryId]) {
      if (size === 'large') {
        this.getLargeCover(id);
      } else {
        this.getSmallCover(id);
      }
      return;
    }
    const [locks, url] = this.blobCache[entryId];
    this.blobCache[entryId] = [locks + 1, url];
  }

  decreaseCacheLocks (id: string, size: 'large' | 'small') {
    const entryId = id + '!' + size;
    if (!this.blobCache[entryId]) {
      throw new Error('Entry missing');
    }
    const [locks, url] = this.blobCache[entryId];
    if (locks === 1) {
      url.then((uri) => {
        URL.revokeObjectURL(uri);
        delete this.blobCache[entryId];
      });
      return;
    }
    this.blobCache[entryId] = [locks - 1, url];
  }

  /**
   * 
   * @param docId the document id, starting with or without artowrks/
   * @param size the size, either large (300px) or small (64px)
   */
  get (docId: string, size: 'large' | 'small'): Promise<Blob> {
    if (!docId.startsWith('artworks/')) {
      docId = 'artworks/' + docId;
    }
    return this.artworks.getAttachment(docId, size) as Promise<Blob>; 
  }
  public static getInstance (pouch?: typeof PouchDB) {
    if (!Artwork.sInstance) {
      if (!pouch) {
        throw new Error("Missing pouch parameter for initialization");
      }
      Artwork.sInstance = new Artwork(pouch);
    }
    return Artwork.sInstance;
  }
  public static createInstance (pouch?: typeof PouchDB) {
    Artwork.sInstance = new Artwork(pouch);
  }
  public static get (docId: string, size: 'large' | 'small') {
    return Artwork.getInstance().get(docId, size);
  }
}