import AudioSource from './AudioSource';
import Session from '../app/session';
import Map from './Map';
import * as urljoin from 'url-join';

export default class XHRSource extends AudioSource {
  private origin: string;
  private static sources: Map<XHRSource> = {};
  private tokens: Map<string> = {};
  private prefetched: boolean;
  private track: string;
  public static readonly STREAM_ENDPOINT =  '/api/boombox/stream/' ;

  private constructor (origin: string, track: string) {
    super();
    this.track = track;
    this.origin = origin;
  }
  static from (origin: string, track: string): XHRSource {
    if (XHRSource.sources[track]) {
      return XHRSource.sources[track];
    }

    return XHRSource.sources[track] = new XHRSource(origin, track);
  } 
  getTrack () {
    return this.track;
  }
  async prefetch() {
    if (this.isPrefetched()) {
      return;
    }
    const {ok, token} = await (await Session.fetch(this.origin, '/api/boombox/direct', {
      method: 'POST',
      body: JSON.stringify({track: this.track}),
      headers: {
        'Content-Type': 'application/json'
      }
    })).json();

    if (ok) {
      this.tokens[this.track] = token;
    } else {
      throw new Error("Booh not ok");
    }
    this.prefetched = true;
  }
  async fetch(): Promise<string> {
    if (this.tokens[this.track]) return XHRSource.STREAM_ENDPOINT + this.tokens[this.track];
    
    const {ok, token} = await (await Session.fetch(this.origin, '/api/boombox/direct', {
      method: 'POST',
      body: JSON.stringify({track: this.track}),
      headers: {
        'Content-Type': 'application/json'
      }
    })).json();

    if (ok) {
      this.prefetched = true;
      this.tokens[this.track] = token;

      return urljoin(this.origin, XHRSource.STREAM_ENDPOINT, token);
    } else {
      throw new Error();
    }
    
  }
  isPrefetched(): boolean {
    return this.prefetched;
  }
  
}
