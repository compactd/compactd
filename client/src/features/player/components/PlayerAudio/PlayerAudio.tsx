import * as React from 'react';
import {PlayerActions} from '../../actions.d';
import {AudioSource} from 'definitions';
require('./PlayerAudio.scss');

interface PlayerAudioProps {
  source: AudioSource;
  playing: boolean;
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

  constructor () {
    super();
    this.audio = new Audio();
  }

  componentWillReceiveProps (nextProps: PlayerAudioProps) {
    if (nextProps.source !== this.props.source) {
      fetchToken(nextProps.source).then((token) => {
        this.audio.src = '/api/boombox/stream/' + token;
        this.audio.currentTime = 0;
        if (nextProps.playing && nextProps.source) {
          this.audio.play();
        }
      });
    }
    if (nextProps.playing !== nextProps.playing && nextProps.source) {
      if (nextProps.playing) {
        this.audio.play()
      } else {
        this.audio.pause();
      }
    }
  }

  render (): JSX.Element {
    return <div className="player-audio">
    </div>
  }
}
