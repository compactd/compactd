import * as React from 'react';
import {PlayerActions} from '../../actions.d';
import {AudioSource} from 'definitions';
import Session from 'app/session';
import * as d3 from 'd3';
import * as cn from 'classnames';
import { Selection } from 'd3';

const  WaveformData = require('waveform-data');

require('./PlayerAudio.scss');

interface PlayerAudioProps {
  source?: AudioSource;
  nextSource?: AudioSource;
  playing: boolean;
  onEnd?: () => void;
  timeUpdate?: (time: number) => void;
  expanded?: boolean;
}

const tokens: {[id: string]: string}  = {};
async function report (source: string) {
  const res = await fetch(`/api/reports/${source}/listen`, Session.init({
    method: 'POST'
  }));
  return;
}
async function fetchToken (source: string) {
  if (tokens[source]) return tokens[source];

  const {ok, token} = await (await fetch('/api/boombox/direct', {
    method: 'POST',
    body: JSON.stringify({track: source}),
    headers: Session.headers({
      'Content-Type': 'application/json'
    })
  })).json();

  if (ok) {
    tokens[source] = token;
    return token;
  } else {
    throw new Error();
  }
}

const sampleData = [123,34,115,97,109,112,108,101,95,114,97,116,101,34,58,52,52,49,48,48,44,34,115,97,109,112,108,101,115,95,112,101,114,95,112,105,120,101,108,34,58,50,53,54,44,34,98,105,116,115,34,58,49,54,44,34,108,101,110,103,116,104,34,58,54,57,51,55,49,44,34,100,97,116,97,34,58,91,45,49,44,48,44,45,49,44,48,44,45,49,44,48,44,45,49,44,48,44,45,49,44,48,44,45,49,44,48,44,45,49,44,48,44,45,49,44,48,44,45,49,44,48,44,45,49,44,48,44,45,49,44,48,44,45,49,44,48,44,45,50,44,48,44,45,49,44,49,44,45,49,44,49,44,45,50,44,48,44,45,49,44,49,44,45,50,44,49,44,45,50,44,48,44,45,49,44,49,44,45,50,44,49,44,45,50,44,48,44,48,44,49,44,45,51,44,48,44,45,50,44,48,44,45,49,44,50,44,45,51,44,48,44,45,50,44,49,44,45,49,44,50,44,45,50,44,48,44,45,50,44,49,44,45,49,44,50,44,45,51,44,48,44,45,50,44,50,44,45,49,44,50,44,45,52,44,48,44,45,51,44,50,44,45,50,44,50,44,45,52,44,48,44,45,50,44,51,44,45,50,44,51,44,45,52,44,48,44,45,49,44,50,44,45,51,44,50,44,45,52,44,49,44,45,49,44,50,44,45,53,44,51,44,45,52,44,49,44,45,49,44,51,44,45,52,44,50,44,45,52,44,50,44,48,44,51,44,45,52,44,48,44,45,51,44,50,44,45,49,44,52,44,45,52,44,49,44,45,51,44,51,44,45,49,44,52,44,45,53,44,49,44,45,52,44,51,44,45,50,44,52,44,45,52,44,48,44,45,51,44,52,44,45,50,44,51,44,45,52,44,48,44,45,50,44,52,44,45,52,44,51,44,45,52,44,45,49,44,45,50,44,51,44,45,52,44,51,44,45,52,44,48,44,45,50,44,52,44,45,52,44,50,44,45,51,44,49,44,45,49,44,52,44,45,52,44,50,44,45,52,44,49,44,45,49,44,52,44,45,52,44,49,44,45,52,44,50,44,48,44,51,44,45,52,44,49,44,45,51,44,51,44,45,49,44,52,44,45,49,54,44,53,44,45,50,50,44,50,51,44,45,51,51,44,51,51,44,45,54,53,44,53,55,44,45,49,53,54,44,49,53,48,44,45,49,53,52,44,50,48,54,44,45,49,54,51,44,49,54,53,44,45,50,49,52,44,50,49,52,44,45,50,48,48,44,50,55,56,44,45,52,49,53,44,50,50,57,44,45,50,51,52,44,50,52,57,44,45,50,51,52,44,50,57,56,44,45,50,48,56,44,50,57,55,44,45,51,49,55,44,51,55,50,44,45,51,53,54,44,52,53,48,44,45,53,52,53,44,53,57,53,44,45,53,54,56,44,54,52,51,44,45,53,55,55,44,56,53,56,44,45,56,48,54,44,49,48,51,51,44,45,50,49,49,48,44,49,50,54,53,44,45,50,50,55,55,44,49,53,49,48,44,45,50,57,53,48,44,50,56,56,49,44,45,50,56,55,48,44,50,54,55,51,44,45,50,53,54,54,44,50,55,57,55,44,45,50,56,52,55,44,51,52,49,51,44,45,50,52,55,56,44,51,49,55,48,44,45,50,57,48,52,44,51,50,48,52,44,45,50,56,53,56,44,50,56,51,53,44,45,51,49,52,50,44,51,50,51,50,44,45,50,56,55,51,44,50,56,51,48,44,45,50,50,55,55,44,50,57,53,50,44,45,51,50,48,52,44,50,51,50,50,44,45,50,52,50,52,44,49,56,54,52,44,45,49,55,54,53,44,49,57,51,49,44,45,50,50,50,56,44,49,57,54,51,44,45,49,57,57,49,44,49,54,56,52,44,45,49,51,56,56,44,49,57,49,51,44,45,49,54,54,48,44,49,52,57,51,44,45,49,48,51,54,44,49,48,55,56,44,45,49,52,54,50,44,49,48,56,48,44,45,49,54,51,57,44,57,48,52,44,45,49,50,53,55,44,49,50,48,49,44,45,49,54,55,53,44,49,52,52,56,44,45,49,54,53,49,44,49,51,52,52,44,45,49,52,53,51,44,49,52,49,56,44,45,49,49,51,57,44,49,51,48,53,44,45,55,57,56,44,49,54,54,55,44,45,49,48,57,50,44,49,51,50,52,44,45,49,50,55,52,44,49,56,49,53,44,45,49,55,51,53,44,49,53,51,54,44,45,57,51,56,44,49,51,50,52,44,45,57,57,49,44,56,50,52,44,45,56,49,50,44,54,56,50,44,45,54,51,55,44,53,49,52,44,45,53,49,55,44,53,51,54,44,45,55,49,57,44,56,48,50,44,45,49,49,49,56,44,49,48,55,49,44,45,49,52,56,50,44,49,51,55,52,44,45,50,48,52,55,44,50,53,57,49,44,45,49,56,48,53,44,49,57,52,52,44,45,50,52,54,51,44,50,55,51,49,44,45,50,55,51,49,44,51,50,54,51,44,45,51,50,51,55,44,50,56,54,53,44,45,51,50,55,50,44,50,56,53,55,44,45,50,55,55,54,44,50,51,53,53,44,45,49,57,52,52,44,50,49,49,51,44,45,49,50,56,53,44,49,55,56,54,44,45,49,48,50,48,44,49,49,53,52,44,45,49,51,56,52,44,57,52,50,44,45,55,52,49,44,57,48,52,44,45,57,50,53,44,57,56,55,44,45,55,51,50,44,55,51,48,44,45,57,49,53,44,55,54,55,44,45,53,53,53,44,53,56,54,44,45,54,54,55,44,55,50,57,44,45,55,57,50,44,54,57,52,44,45,53,49,51,44,55,56,50,44,45,55,49,56,44,54,57,54,44,45,49,49,57,52,44,57,54,55,44,45,49,50,52,57,44,57,53,48,44,45,49,48,49,48,44,49,53,48,50,44,45,49,49,51,55,44,49,53,56,53,44,45,49,50,55,51,44,49,50,53,54,44,45,49,52,48,56,44,49,54,52,54,44,45,49,52,51,50,44,49,48,53,55,44,45,49,50,55,56,44,49,53,48,55,44,45,49,50,53,53,44,49,54,56,52,44,45,56,51,56,44,49,49,55,55,44,45,49,49,56,52,44,57,50,56,44,45,49,51,54,50,44,49,48,52,56,44,45,49,51,48,49,44,49,48,50,49,44,45,57,50,53,44,49,48,49,55,44,45,49,49,48,53,44,57,56,55,44,45,49,53,52,51,44,57,55,52,44,45,56,52,57,44,49,51,48,51,44,45,57,51,56,44,49,50,50,54,44,45,49,48,52,53,44,49,49,53,53,44,45,56,48,55,44,57,54,56,44,45,49,52,48,49,44,49,48,53,49,44,45,55,53,54,44,57,52,49,44,45,49,49,54,49,44,49,51,48,48,44,45,49,48,57,51,44,57,53,55,44,45,57,53,49,44,49,50,53,52,44,45,57,48,55,44,49,52,54,49,44,45,49,48,55,53,44,49,48,52,52,44,45,49,50,57,48,44,49,48,50,52,44,45,56,49,57,44,54,48,57,44,45,49,48,49,57,44,56,48,56,44,45,49,54,52,56,44,49,54,55,55,44,45,49,49,55,54,44,49,48,50,55,44,45,49,53,50,53,44,49,50,52,49,44,45,49,49,52,50,44,57,57,57,44,45,49,51,55,57,44,49,48,57,57,44,45,49,49,56,51,44,49,57,52,56,44,45,49,48,48,50,44,49,49,52,55,44,45,57,51,49,44,49,53,52,50,44,45,49,51,54,54,44,49,53,51,49,44,45,49,57,56,52,44,49,51,51,57,44,45,57,56,48,44,49,48,54,53,44,45,49,48,55,49,44,57,56,50,44,45,49,50,49,57,44,57,53,51,44,45,49,49,51,53,44,56,55,50,44,45,49,48,52,55,44,49,50,56,53,44,45,49,50,56,54,44,57,55,54,44,45,57,54,55,44,49,49,56,56,44,45];

function debounce(callback: Function, wait: number, context: any = this) {
  let timeout: any = null;
  let callbackArgs: any = null;
  
  const later = () => callback.apply(context, callbackArgs);
  
  return function() {
    callbackArgs = arguments;
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  }
}


export class PlayerAudio extends React.Component<PlayerAudioProps, {}>{
  data: ArrayBuffer;
  pSvg: SVGSVGElement;
  private svg: SVGSVGElement;
  private audio: HTMLAudioElement;
  private range: HTMLDivElement;

  constructor () {
    super();
    (window as any).boombox = this.audio = new Audio();
  }
  updateRange () {
    if (this.svg && this.pSvg) {
      this.updateSvgWidths();
      return;
    }
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
      if (this.range) {
        this.range.style.display = 'block';
        this.updateRange();
      }
    }
    this.audio.onended = (event) => {
      if (this.props.onEnd) {
        this.props.onEnd();
      }
    }
    this.audio.addEventListener('timeupdate', () => {
      window.requestAnimationFrame(() => {
        this.updateRange();
        if (this.props.timeUpdate) {
          this.props.timeUpdate(this.audio.currentTime);
        }
      })
    });

    window.addEventListener('resize', () => {
      debounce(() => {
        this.buildWaveform(this.data);
      }, 250);
    })

  }
  handleRangeClick (event: any) {
    const {left, width} = (this.svg && this.pSvg) ? this.svg.parentElement.getBoundingClientRect() : this.range.getBoundingClientRect();
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
        return Session.fetch(`/api/${nextProps.source.replace(/^library/, 'tracks')}/waveform`);
      }).then((data) => {
        return data.arrayBuffer();
      }).then((data) => {
        this.data = data;
        this.buildWaveform(data);
        return report(nextProps.source);
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
  setVolume (val: number) {
    this.audio.volume = val;
  }
  renderSlider (): JSX.Element {
    return <div className="player-range" ref={(ref) => this.range = ref}
    onClick={this.handleRangeClick.bind(this)}></div>;
  }
  renderWaveform (): JSX.Element {
    return <div className="waveforms">
      <svg className="waveform" onClick={this.handleRangeClick.bind(this)} ref={(ref) => this.svg = ref} height="50px" ></svg>
      <svg className="waveform" onClick={this.handleRangeClick.bind(this)} ref={(ref) => this.pSvg = ref} height="50px"   width="0px"></svg>
    </div>;
  }
  renderContent (): JSX.Element {
    return this.renderWaveform();
  }
  updateSvgWidths () {
    const {width} = this.svg.parentElement.getBoundingClientRect();
    
    this.svg.setAttribute("width", width + "px");
    const duration = this.audio.duration;
    // const {width} = this.range.getBoundingClientRect();
    const current = this.audio.currentTime;
    const pos = (current || 0) / (duration || 1);

    this.pSvg.setAttribute("width", pos * width + "px");
  }
  buildWaveform (wf: ArrayBuffer, svge?: SVGSVGElement, barClass: string = "") {
    this.updateSvgWidths();
    if (!svge) {
      this.buildWaveform(wf, this.svg);
      this.buildWaveform(wf, this.pSvg, "progress");
    }
    const svg = d3.select(svge);
    const x = d3.scaleLinear()
    const y = d3.scaleLinear();
    const {height, width} = this.svg.getBoundingClientRect();
    const gap = 1;
    const relativeGap = gap / width;
    const data = WaveformData.create(wf).resample({width: width / 2});
    const barWidth = width / data.adapter.length - gap;

    const middleGap = 1
    const topHeight = height * 2/3;
    const botHeight = height * 1/3 - middleGap;
    
    x.domain([0, data.adapter.length]);

    y.domain([0, d3.max<number>(data.max)]);
    svg.selectAll('*').remove();
    const g = svg.append("g").selectAll('.bar')
      .data(data.max as number[])
      .enter()
      .append("g")
        .attr("x", (val, index) => x(index) * width)
        .attr("y", 0)
        .attr("height", height)
        .attr("width", barWidth)


      g.append("rect")
        .attr("class", cn("bar", barClass))
        .attr("x", (val, index) => x(index) * width)
        .attr("y", (val, index) => (1 - y(val)) * topHeight)
        .attr("height", (val, index) => y(val) * topHeight)
        .attr("width", barWidth);
      g.append("rect")
        .attr("class", cn("bar", "bot", barClass))
        .attr("x", (val, index) => x(index) * width)
        .attr("y", (val, index) => topHeight + middleGap)
        .attr("height", (val, index) => y(val) * botHeight)
        .attr("width", barWidth);

  }

  render (): JSX.Element {
    return <div className="player-audio expanded">
      {this.renderContent()}
    </div>
  }
}
