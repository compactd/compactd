import * as React from 'react';
import {PlayerActions} from '../../actions.d';
import {AudioSource} from 'definitions';
import Session from 'app/session';
import * as d3 from 'd3';
import * as cn from 'classnames';
const debounce = require('debounce');

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
    if (this.props.expanded) return;
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

    window.addEventListener('resize', debounce(() => {
        if (this.props.expanded) {
          this.updateSvgWidths();
          this.buildWaveform(this.data);
        }
      }, 420))

  }
  handleRangeClick (event: any) {
    const {left, width} = (this.svg && this.pSvg) ? this.svg.parentElement.getBoundingClientRect() : this.range.getBoundingClientRect();
    const x = event.nativeEvent.x;
    this.audio.currentTime = (x - left) / (width) * this.audio.duration;
  }
  fetchWaveform (src: string) {
    return Session.fetch(`/api/${src.replace(/^library/, 'tracks')}/waveform`).then((data) => {
      return data.arrayBuffer();
    }).then((data) => {
      this.data = data;
      this.updateSvgWidths();
      this.buildWaveform(data);
    });
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
        this.updateSvgWidths();
        
        return this.fetchWaveform(nextProps.source);
      }).then(() => {
        report(nextProps.source);
      });
    }
    if (nextProps.playing !== this.props.playing && nextProps.source) {
      if (nextProps.playing) {
        this.audio.play()
      } else {
        this.audio.pause();
      }
    }
    if (nextProps.expanded && !this.props.expanded) {
      this.fetchWaveform(nextProps.source || this.props.source);
    }
    if (!nextProps.expanded && this.props.expanded) {
      if (this.props.source || nextProps.source) {

      }
    }

  }
  setVolume (val: number) {
    this.audio.volume = val;
  }
  renderSlider (): JSX.Element {
    return <div><div className="player-range" ref={(ref) => {
      this.range = ref
      if (this.props.source && !this.props.expanded && ref) {
         this.range.style.display = 'block';
      }
    }}
    onClick={this.handleRangeClick.bind(this)}></div></div>;
  }
  renderWaveform (): JSX.Element {
    return <div className="waveforms">
      <svg className="waveform" onClick={this.handleRangeClick.bind(this)} ref={(ref) => this.svg = ref} height="50px" ></svg>
      <svg className="waveform" onClick={this.handleRangeClick.bind(this)} ref={(ref) => this.pSvg = ref} height="50px"   width="0px"></svg>
    </div>;
  }
  renderContent (): JSX.Element {
    if (this.props.expanded) {
      return this.renderWaveform();
    }
    return this.renderSlider();
  }
  updateSvgWidths () {
    if (!this.svg) return;
    const {width} = this.svg.parentElement.getBoundingClientRect();
    
    this.svg.setAttribute("width", width + "px");
    const duration = this.audio.duration;
    // const {width} = this.range.getBoundingClientRect();
    const current = this.audio.currentTime;
    const pos = (current || 0) / (duration || 1);

    this.pSvg.setAttribute("width", pos * width + "px");
  }
  buildWaveform (wf: ArrayBuffer, svge?: SVGSVGElement, barClass: string = "") {
    if (!this.svg) return;
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
    const {expanded} = this.props;
    return <div className={cn("player-audio", {expanded})}>
      {this.renderContent()}
    </div>
  }
}
