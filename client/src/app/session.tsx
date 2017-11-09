import * as jwt from 'jwt-decode';
import PouchDB from 'pouchdb';

class SessionManager {
  private storage: Storage;
  private tokenName = 'session_token';

  constructor(storage = window.localStorage) {
    this.storage = storage;
  }
  public getUser () {
    return this.decodeToken().user;
  }
  public getToken () {
    return this.storage.getItem(this.tokenName);
  }
  protected setToken (token: string) {
    this.storage.setItem(this.tokenName, token);
  }
  protected decodeToken (token = this.getToken()) {
    if (!token) return null;
    return jwt(token) as {
      exp: number,
      iat: number,
      iss: string,
      user: string,
      ok: boolean
    }
  }
  isSignedIn () {
    const session = this.decodeToken();
    if (!session) return false;
    if (session.exp > Date.now()) {
      return false;
    }
    if (!session.user || !session.ok) {
      return false;
    }
    return true;
  }
  getStatus (): Promise<{
    versions: {
      server: string,
      models: string,
    },
    user?: string
  }> {
    const init: RequestInit = {};
    if (this.isSignedIn()) {
      init.headers = this.headers();
    }
    return fetch('/api/status', init).then((res) => res.json());
  }
  signIn (username: string, password: string) {
    return fetch('/api/sessions', {
      method: 'POST',
      headers: new Headers({'content-type': 'application/json'}),
      body: JSON.stringify({username, password})
    }).then((res) => res.json()).then((res) => {
      
      this.setToken(res.token)
      
      return this.decodeToken(res.token);
    }).catch((err) => {
      return Promise.reject('Invalid username or password');
    });
  }
  fetch (input: RequestInfo, init?: {
    method: string,
    body: string, 
    headers?: {
      [name: string]: string
    }
  }) {
    return fetch(input, this.init({
      ...init,
      headers: new Headers(init.headers)
    }));
  }
  headers (headers: any = {}) {
    return new Headers(Object.assign({}, headers, {
      Authorization: `Bearer ${this.getToken()}`
    }));
  }
  init (init: RequestInit = {}) {
    return Object.assign({}, init, {
      headers: this.headers(init.headers)
    });
  }
  logout () {
    this.storage.removeItem(this.tokenName);
  }
  destroy () {
    this.logout();
    const dbs =  [ 'artists', 'albums', 'tracks', 'artworks', 'files', 'trackers', 'libraries'];
    return Promise.all(dbs.map((db) => {
      const database = new PouchDB(db);
      return database.destroy();
    }));
  }
}

const instance = new SessionManager();

export default instance;