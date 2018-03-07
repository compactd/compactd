import * as jwt from 'jwt-decode';
import PouchDB from 'pouchdb-browser';
import * as urljoin from 'url-join';
import * as hash from 'md5';

class SessionManager {
  private storage: Storage;
  private tokenName = 'session_token_';

  constructor(storage = window.localStorage) {
    this.storage = storage;
  }
  public getUser (origin: string) {
    return this.decodeToken(origin, this.getToken(origin)).user;
  }
  public getToken (origin: string) {
    return this.storage.getItem(this.tokenName + hash(origin));
  }
  protected setToken (origin: string, token: string) {
    this.storage.setItem(this.tokenName + hash(origin), token);
  }
  protected decodeToken (origin: string, token: string) {
    if (!token) return null;
    return jwt(token) as {
      exp: number,
      iat: number,
      iss: string,
      user: string,
      ok: boolean
    }
  }
  isSignedIn (origin: string) {
    const session = this.decodeToken(origin,  this.getToken(origin));
    if (!session) return false;
    if (session.exp > Date.now()) {
      return false;
    }
    if (!session.user || !session.ok) {
      return false;
    }
    return true;
  }
  getStatus (origin: string): Promise<{
    versions: {
      server: string,
      models: string,
    },
    user?: string
  }> {
    const init: RequestInit = {};
    if (this.isSignedIn(origin)) {
      init.headers = this.headers(origin);
    }
    return fetch(urljoin(origin, '/api/status'), init).then((res) => res.json());
  }
  signIn (origin: string, username: string, password: string) {
    return fetch(urljoin(origin, '/api/sessions'), {
      method: 'POST',
      headers: new Headers({'content-type': 'application/json'}),
      body: JSON.stringify({username, password})
    }).then((res) => res.json()).then(({token}) => {
      this.setToken(origin, token)
      return this.decodeToken(origin, token);
    }).catch((err) => {
      return Promise.reject('Invalid username or password');
    });
  }
  post (origin: string, url: string, body: any) {
    return this.fetch(origin, url, {
      method: 'POST',
      headers: {
        'content-type': 'application/json'
      },
      body: JSON.stringify(body)
    });
  }
  put (origin: string, url: string, body: any) {
    return this.fetch(origin, url, {
      method: 'PUT',
      headers: {
        'content-type': 'application/json'
      },
      body: JSON.stringify(body)
    });
  }
  fetch (origin: string, input: string, init: {
    method: string,
    body: any, 
    headers?: {
      [name: string]: string
    }
  } = {method: 'GET', body: {}}) {
    if (init.method === 'GET') {
      return fetch(urljoin(origin, input), this.init(origin, {
        method: 'GET',
        headers: init.headers
      }));
    }

    return fetch(urljoin(origin, input), this.init(origin, {
      ...init,
      headers: new Headers(init.headers)
    }));
  }
  private headers (origin: string, headers: any = {}) {
    if (headers instanceof Headers) {
      headers.set('Authorization', `Bearer ${this.getToken(origin)}`);
      return headers;
    }
    return new Headers(Object.assign({}, headers, {
      Authorization: `Bearer ${this.getToken(origin)}`
    }));
  }
  private init (origin: string, init: RequestInit = {}) {
    return Object.assign({}, init, {
      headers: this.headers(origin, init.headers)
    });
  }
  logout () {
    this.storage.removeItem(this.tokenName);
  }
}

const instance = new SessionManager();

export default instance;