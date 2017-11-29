import PouchDB from 'pouchdb';
import * as PQueue from 'p-queue';
import Session from 'app/session';

export default class Artwork {
  private queue: PQueue;

  private blobCache: {
    [id: string]: [number, Promise<string>]
  } = {};

  private artworks: PouchDB.Database<{}>;
  private static sInstance: Artwork;

  private PouchDB: PouchDB.Static;
  private constructor (pouch = PouchDB) {
    this.PouchDB = pouch;
    this.artworks = new pouch('artworks');
    this.queue = new PQueue({
      concurrency: 2,
    });
  }

  loadLargeCover (id: string, size = 64, target: HTMLImageElement) {
    return this.load(id, 'large', target);
  }

  loadSmallCover (id: string, size = 32, target: HTMLImageElement) {
    return this.load(id, 'small', target);
  }

  attach (blob: Blob, target: HTMLImageElement, oldSrc: string): Promise<Blob> {
    return new Promise((resolve) => {
      if (oldSrc !== target.src) {
        return resolve(blob);
      }
      target.src = URL.createObjectURL(blob);
      target.addEventListener('load', () => {
        resolve(blob);
      });
    })
  }

  /**
   * 
   * @param docId the document id, starting with or without artowrks/
   * @param size the size, either large (300px) or small (64px)
   */
  load (docId: string, size: 'large' | 'small', target: HTMLImageElement): Promise<Blob> {
    const oldSrc = target.src;
    return this.queue.add(() => {
      if (!docId.startsWith('artworks/')) {
        docId = 'artworks/' + docId;
      }
      return this.artworks.getAttachment(docId, size).catch((err) => {
        console.log('No attachment for: ' + docId);
        return fetch('/api/assets/no-album.jpg', {
          method: 'GET',
          headers: Session.headers()
        }).then((res) => {
          return res.blob();
        });
      }).then((res: Blob) => {
        return this.attach(res, target, oldSrc);
      });
    });
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
}