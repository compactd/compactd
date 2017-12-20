import * as React from 'react';
import {PlayerActions} from '../../actions.d';
import {AudioSource} from 'definitions';
import Session from 'app/session';
import * as d3 from 'd3';
import * as cn from 'classnames';
import 'd3-transition';
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
      this.showAndUpdateRange();
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
  private showAndUpdateRange() {
    if (this.range) {
      this.range.style.display = 'block';
      this.updateRange();
    }
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
      this.buildWaveform(null);
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
      this.buildWaveform(null);
      this.fetchWaveform(nextProps.source || this.props.source);
    }
    if (!nextProps.expanded && this.props.expanded) {
      if (this.props.source || nextProps.source) {
        this.showAndUpdateRange();
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
    const transition = d3.transition().duration(500).ease();
    const svg = d3.select(svge);
    const x = d3.scaleLinear()
    const y = d3.scaleLinear();
    const {height, width} = this.svg.getBoundingClientRect();
    const gap = 1;
    const relativeGap = gap / width;
    if (!wf) {
      svg.selectAll('*').remove();
      return;
    }
    const data = wf? WaveformData.create(wf).resample({width: width / 3}) :  null;
    const samples = data? data.adapter.length : width / 3;

    const barWidth = width / samples - gap;

    const middleGap = 1
    const topHeight = height * 2/3;
    const botHeight = height * 1/3 - middleGap;
    const ANIMATION_LENGTH = 500;
    const ANIMATION_DURATION = 250;

    const delayPerBar = ANIMATION_LENGTH / samples;
    
    x.domain([0, samples]);

    y.domain([0, d3.max<number>(data ? data.max : [20])]);
    svg.selectAll('*').remove();
    const g = svg.append("g")
      .selectAll('g')
      .data(data ? data.max as number[] : new Array(samples).fill(5))
      .enter()
      .append("g")
        .attr("x", (val, index) => x(index) * width)
        .attr("y", 0)
        .attr("height", height)
        .attr("width", barWidth)


      g.append("rect")
        .attr("class", cn("bar", barClass))
        .attr("width", barWidth)
        .attr("y", topHeight)
        .attr("x", (val, index) => x(index) * width)
        .attr("height", 1)
        .transition().duration(ANIMATION_DURATION).delay((d, i) => {
          return i * delayPerBar;
        })
        .attr("y", (val, index) => 
          (1 - y(val)) * topHeight
        )
        .attr("height", (val, index) => y(val) * topHeight)
      g.append("rect")
        .attr("class", cn("bar", "bot", barClass))
        .attr("x", (val, index) => x(index) * width)
        .attr("y", (val, index) => topHeight + middleGap)
        .attr("height", 1)
        .attr("width", barWidth)
        .transition().duration(ANIMATION_DURATION).delay((d, i) => {
          return i * delayPerBar + 150;
        })
        .attr("height", (val, index) => y(val) * botHeight)

  }

  render (): JSX.Element {
    const {expanded} = this.props;
    return <div className={cn("player-audio", {expanded})}>
      {this.renderContent()}
    </div>
  }
}
