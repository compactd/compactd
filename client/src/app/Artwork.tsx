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
    return this.get(id, 'large').then((blob) => {
      return URL.createObjectURL(blob);
    });
  }

  getSmallCover (id: string, size = 32) {
    return this.get(id, 'small').then((blob) => {
      return URL.createObjectURL(blob);
    });
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
    return this.artworks.getAttachment(docId, size).catch((err) => {
      console.log('No attachment for:' + docId);
      
      return Promise.resolve(new Blob());
    }) as Promise<Blob>; 
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