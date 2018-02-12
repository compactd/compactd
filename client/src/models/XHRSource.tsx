import AudioSource from './AudioSource';
import Session from '../app/session';
import Map from './Map';

export default class XHRSource extends AudioSource {
  private static sources: Map<XHRSource> = {};
  private tokens: Map<string> = {};
  private prefetched: boolean;
  private track: string;
  public static readonly STREAM_ENDPOINT =  '/api/boombox/stream/' ;

  private constructor (track: string) {
    super();
    this.track = track;
  }
  static from (track: string): XHRSource {
    if (XHRSource.sources[track]) {
      return XHRSource.sources[track];
    }

    return XHRSource.sources[track] = new XHRSource(track);
  } 
  getTrack () {
    return this.track;
  }
  async prefetch() {
    if (this.isPrefetched()) {
      return;
    }
    const {ok, token} = await (await fetch('/api/boombox/direct', {
      method: 'POST',
      body: JSON.stringify({track: this.track}),
      headers: Session.headers({
        'Content-Type': 'application/json'
      })
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
    
    const {ok, token} = await (await fetch('/api/boombox/direct', {
      method: 'POST',
      body: JSON.stringify({track: this.track}),
      headers: Session.headers({
        'Content-Type': 'application/json'
      })
    })).json();

    if (ok) {
      this.prefetched = true;
      this.tokens[this.track] = token;

      return XHRSource.STREAM_ENDPOINT + token;
    } else {
      throw new Error();
    }
    
  }
  isPrefetched(): boolean {
    return this.prefetched;
  }
  
}
