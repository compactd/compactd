import PouchDB from 'pouchdb';

export default class Artwork {
  private artworks: PouchDB.Database<{}>;
  private static sInstance: Artwork;

  private PouchDB: PouchDB.Static;
  private constructor (pouch: typeof PouchDB) {
    this.PouchDB = pouch;
    this.artworks = new pouch('artworks');
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