import Map from 'models/Map';

export enum Status {
  BAREBONE, PREFETCHED, FETCHED, DELETED, DESTROYED
}

export enum FindMode {
  FETCH, PREFETCH, BAREBONE
}

export interface ModelEventListener<T> {
  onDelete: (id: string) => void;
  onPropsChanged: (propName: string, newProps: T, oldProps: T) => void;
}

export interface EventListenerUnbinder {
  unbind: () => void;
}

export abstract class CompactdModel<T> {
  protected database: PouchDB.Database<T>;
  protected pouchdb: PouchDB.Static;
  protected _status: Status;
  protected _id: string;
  protected _fetch: typeof fetch;

  protected listeners: Map<ModelEventListener<T>> = {};
  private _live: boolean;

  protected constructor (pouch: typeof PouchDB, f: typeof fetch, model: string, id: string, status: Status) {
    this._fetch = f;
    this._id = id;
    this._status = status;
    this.pouchdb = pouch;
    this.database = new pouch<T>(model);
  }
  public get id () {
    return this._id;
  }
  public get live () {
    return this._live;
  }
  public get status ()  {
    return this._status;
  }
  public abstract get props (): T;

  public fetch () {
    if (this._status === Status.FETCHED) {
      return;
    }
    return this.pull().then(() => {
       this._status = Status.FETCHED;
    });
  }
  
  protected abstract pull (): Promise<void>;
  public abstract delete (): Promise<void>;

  public addEventListener (listener: ModelEventListener<T>): EventListenerUnbinder {
    const key = Date.now();
    this.listeners[key] = listener;

    this.attachFeed();

    return {
      unbind: () => {
        if (this.listeners[key]) {
          delete this.listeners[key];
        }
        if (Object.keys(this.listeners).length === 0) {
          this.detachFeed();
        }
      }
    }
  }

  // public feed (callback: (props: T & {_rev: string}) => void) {
  //   enum feedState {
  //     cancelled, paused, running, created
  //   }
  //   let state = feedState.created;
  //   let unbinder: EventListenerUnbinder;
  //   const funcs = {
  //     cancel: () => {
  //       if (state === feedState.cancelled) {
  //         throw new Error('Cannot cancel an already cancelled feed');
  //       }
  //       funcs.pause();
  //     },
  //     pause: () => {
  //       if (state !== feedState.running) {
  //         return;
  //       }
  //       unbinder.unbind();
  //       unbinder = null;
  //     },
  //     start: () => {
  //       if (state === feedState.paused) {
  //         return;
  //       }
  //       if (state === feedState.cancelled) {
  //         throw new Error('Cannot start a cancelled feed');
  //       }
  //       if ([Status.PREFETCHED, Status.BAREBONE].includes(this.status)) {
  //         this.pull().then(() => {
  //           funcs.start();
  //         });
  //         return;
  //       }
  //       unbinder = this.addOnPropsChangedListener((name, newProps) => {
  //         callback(newProps);
  //       });
  //       state = feedState.running;
  //     }
  //   }
  //   return funcs;
  // }

  public addOnPropsChangedListener (callback: (propName: string, newProps: T & {_rev: string}, oldProps: T) => void) {
    return this.addEventListener({
      onPropsChanged: callback,
      onDelete: () => {}
    });
  }

  protected fireOnDelete (id: string) {
    Object.values(this.listeners).forEach((listener) => {
      listener.onDelete(id);
    });
  }

  protected fireOnPropsChanged (propName: string, newProps: T, oldProps: T) {
    Object.values(this.listeners).forEach((listener) => {
      listener.onPropsChanged(propName, newProps, oldProps)
    });
  }
  
  protected abstract attachFeed (): void;
  protected abstract detachFeed (): void;
}