import * as React from 'react';
import {PlayerActions} from '../../actions.d';
import {AudioSource} from 'definitions';
require('./PlayerAudio.scss');

interface PlayerAudioProps {
  source?: AudioSource;
  nextSource?: AudioSource;
  playing: boolean;
  onEnd?: () => void;
}

const tokens: {[id: string]: string}  = {};

async function fetchToken (source: string) {
  if (tokens[source]) return tokens[source];

  const {ok, token} = await (await fetch('/api/boombox/direct', {
    method: 'POST',
    body: JSON.stringify({track: source}),
    headers: {
      Authorization: `Bearer ${window.sessionStorage.getItem('session_token')}`,
      'Content-Type': 'application/json'
    }
  })).json();

  if (ok) {
    tokens[source] = token;
    return token;
  } else {
    throw new Error();
  }
}

export class PlayerAudio extends React.Component<PlayerAudioProps, {}>{
  private audio: HTMLAudioElement;
  private range: HTMLDivElement;

  constructor () {
    super();
    (window as any).boombox = this.audio = new Audio();
  }
  updateRange () {
    const duration = this.audio.duration;
    // const {width} = this.range.getBoundingClientRect();
    const current = this.audio.currentTime;
    const pos = (current || 0) / (duration || 1) * 100;
    const color1 = '#ffffff';
    const color2 = '#515760';

    const grad = `${color1} 0%,${color1} ${pos}%, ${color2
      } ${pos}%,${color2} 100%`;
    this.range.style.background = `linear-gradient(to right, ${grad})`;
  }
  componentDidMount () {
    this.audio.onloadedmetadata = (event) => {
      this.range.style.display = 'block';
      this.updateRange();
    }
    this.audio.onended = (event) => {
      if (this.props.onEnd) {
        this.props.onEnd();
      }
    }
    this.audio.addEventListener('timeupdate', () => {
      this.updateRange();
    });

  }
  handleRangeClick (event: any) {
    const {left, width} = this.range.getBoundingClientRect();
    const x = event.nativeEvent.x;
    this.audio.currentTime = (x - left) / (width) * this.audio.duration;
  }
  componentWillReceiveProps (nextProps: PlayerAudioProps) {
    if (!nextProps.source) {
      this.range.style.display = 'none';
      this.audio.src = '';
      this.audio.pause();
      return;
    }
    if (nextProps.source !== this.props.source) {
      fetchToken(nextProps.source).then((token) => {
        this.audio.src = '/api/boombox/stream/' + token;
        this.audio.currentTime = 0;
        if (nextProps.playing) {
          this.audio.play();
        }
      });
    }
    if (nextProps.playing !== this.props.playing && nextProps.source) {
      if (nextProps.playing) {
        this.audio.play()
      } else {
        this.audio.pause();
      }
    }
  }

  render (): JSX.Element {
    return <div className="player-audio">
      <div className="player-range" ref={(ref) => this.range = ref}
      onClick={this.handleRangeClick.bind(this)}></div>
    </div>
  }
}
