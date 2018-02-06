import PouchDB from 'pouchdb';
import * as PQueue from 'p-queue';
const debounce = require('debounce');

import Session from 'app/session';

const BLANK_IMAGE = 'data:image/png;base64,R0lGODlhFAAUAIAAAP///wAAACH5BAEAAAAALAAAAAAUABQAAAIRhI+py+0Po5y02ouz3rz7rxUAOw==';

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

  attach (blob: Blob, target: HTMLImageElement): Promise<Blob> {
    return new Promise((resolve) => {
      if (!window.document.contains(target)) {
        return resolve(blob);
      }
      target.src = URL.createObjectURL(blob);
      
      target.addEventListener('load', function onload () {
        resolve(blob);
      }, {once: true});
    });
  }

  shouldAttach (docId: string, target: HTMLImageElement) {
    if (!document.contains(target)) {
      return false;
    }
    const attr = target.getAttribute('data-doc-id');
    if (attr && attr !== docId) {
      return false;
    }
    return true;
  }

  /**
   * 
   * @param docId the document id, starting with or without artowrks/
   * @param size the size, either large (300px) or small (64px)
   */
  load (docId: string, size: 'large' | 'small', target: HTMLImageElement, watch = true): Promise<Blob> {
    if (!docId.startsWith('artworks/')) {
      docId = 'artworks/' + docId;
    }
    target.src = BLANK_IMAGE;
    return this.queue.add(() => {
      if (!this.shouldAttach(docId, target)) {
        return Promise.resolve(new Blob());
      }
      if (watch) {
        const changes: any = this.artworks.changes({
          doc_ids: [docId],
          live: true,
          since: 'now'
        }).on('change', debounce((info: PouchDB.Core.ChangesResponseChange<{}>) => {
          if (!this.shouldAttach(docId, target)) {
            return changes.cancel();
          }
          this.load(docId, size, target, false);
        }, 500, false));
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
        if (!this.shouldAttach(docId, target)) {
          return Promise.resolve(new Blob());
        }
        return this.attach(res, target);
      });
    });
  }
  public static getInstance (pouch = PouchDB) {
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
