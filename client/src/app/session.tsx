import * as jwt from 'jwt-decode';

class SessionManager {
  private storage: Storage;
  private tokenName = 'session_token';
  constructor(storage = window.localStorage) {
    this.storage = storage;
  }
  public getToken () {
    return this.storage.getItem(this.tokenName);
  }
  protected setToken (token: string) {
    this.storage.setItem(this.tokenName, token);
  }
  protected decodeToken (token = this.getToken()) {
    return jwt(token) as {
      exp: number,
      iat: number,
      iss: string,
      user: string,
      ok: boolean
    }
  }
  isSignedIn () {
    const session =  this.decodeToken();
    if (session.exp > Date.now()) {
      return false;
    }
    if (!session.user || !session.ok) {
      return false;
    }
    return true;
  }
  signIn (username: string, password: string) {
    return fetch('/api/sessions', {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({username, password})
    }).then((res) => res.json()).then((res) => {
      
      this.setToken(res.token)
      
      return this.decodeToken(res.token);
    }).catch((err) => {
      return Promise.reject('Invalid username or password');
    });
  }
  fetch (input: RequestInfo, init?: RequestInit) {
    return fetch(input, this.init(init));
  }
  headers (headers: any = {}) {
    return Object.assign({}, headers, {
      Authorization: `Bearer ${this.getToken()}`
    });
  }
  init (init: RequestInit = {}) {
    return Object.assign({}, init, {
      headers: this.headers(init.headers)
    });
  }
  logout () {
    this.storage.removeItem(this.tokenName);
  }
}

const instance = new SessionManager();

export default instance;