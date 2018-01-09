import * as React from 'react';
import {PlayerActions} from '../../actions.d';
import AudioSource from 'models/AudioSource';
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

export class PlayerAudio extends React.Component<PlayerAudioProps, {}>{
  oldPos: number = 0;
  data: ArrayBuffer;
  private svg: SVGSVGElement;
  private audio: HTMLAudioElement;
  private range: HTMLDivElement;

  constructor () {
    super();
    (window as any).boombox = this.audio = new Audio();
  }
  updateRange () {
    if (this.svg) {
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
    const {left, width} = (this.svg) ? this.svg.parentElement.getBoundingClientRect() : this.range.getBoundingClientRect();
    const x = event.nativeEvent.x;
    this.audio.currentTime = (x - left) / (width) * this.audio.duration;
  }
  fetchWaveform (src: string) {
    this.buildWaveform(null);
    return Session.fetch(`/api/${src.replace(/^library/, 'tracks')}/waveform`).then((data) => {
      return data.arrayBuffer();
    }).then((data) => {
      this.data = data;
      this.buildWaveform(data);
      this.updateSvgWidths();
    });
  }
  componentWillReceiveProps (nextProps: PlayerAudioProps) {
    if (!nextProps.source && this.range) {
      this.range.style.display = 'none';
      this.audio.src = '';
      this.audio.pause();
      return;
    }
    if (nextProps.source !== this.props.source) {
      this.buildWaveform(null);
      nextProps.source.fetch().then((url) => {
        this.audio.src = url;
        this.audio.currentTime = 0;
        if (nextProps.playing) {
          this.audio.play();
        }
        this.updateSvgWidths();
        
        return this.fetchWaveform(nextProps.source.getTrack());
      }).then(() => {
        report(nextProps.source.getTrack());
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
      setTimeout(() => {
        window.dispatchEvent(new Event('resize'));
        this.buildWaveform(null);
        this.fetchWaveform((nextProps.source || this.props.source).getTrack());
      }, 250);
    }
    if (!nextProps.expanded && this.props.expanded) {
      if (this.props.source || nextProps.source) {
        this.buildWaveform(null);
        this.showAndUpdateRange();
      }
      setTimeout(() => {
        window.dispatchEvent(new Event('resize'));
      }, 250);
    }
    if (nextProps.nextSource) {
      nextProps.nextSource.prefetch();
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

    const current = this.audio.currentTime;
    const duration = this.audio.duration;

    const pos = (current || 0) / (duration || 1);
    const self = this;

    const anim = 200 * 3 * duration / width;
    
    if (pos >= this.oldPos) {
      d3.select(this.svg).selectAll('rect.bar.top').filter(function (g, d) {
        const x  = +(this as HTMLElement).getAttribute('x');
        const c = x / width
        return  c <= pos && c >= self.oldPos;
      }).style('fill', 'rgba(75, 154, 197, 0.7)').style('stroke', 'rgba(75, 154, 197, 0.7)');
      
      d3.select(this.svg).selectAll('rect.bar.bot').filter(function (g, d) {
        const x  = +(this as HTMLElement).getAttribute('x');
        const c = x / width
        return  c <= pos && c >= self.oldPos;
      }).style('fill', 'rgba(19, 127, 189, 0.5)').style('stroke', 'rgba(19, 127, 189, 0.5)');
    } else {
      d3.select(this.svg).selectAll('rect.bar.top').filter(function (g, d) {
        const x  = +(this as HTMLElement).getAttribute('x');
        const c = x / width
        return  c > pos && c < self.oldPos;
      }).style('fill', null).style('stroke', null);
  
      d3.select(this.svg).selectAll('rect.bar.bot').filter(function (g, d) {
        const x  = +(this as HTMLElement).getAttribute('x');
        const c = x / width
        return  c > pos && c < self.oldPos;
      }).style('fill', null).style('stroke', null);
    }

    this.oldPos = pos;

    // this.pSvg.setAttribute("width", pos * width + "px");
  }
  buildWaveform (wf: ArrayBuffer, svge?: SVGSVGElement, barClass: string = "") {
    if (!this.svg) return;
    if (!svge) {
      this.buildWaveform(wf, this.svg);
      return;
    }
    const transition = d3.transition().duration(500).ease();
    const svg = d3.select(svge);
    const x = d3.scaleLinear()
    const y = d3.scaleLinear();
    const {width} = this.svg.parentElement.getBoundingClientRect();
    this.svg.setAttribute("width", `${width}`);
    const {height} = this.svg.getBoundingClientRect();
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
    const ANIMATION_LENGTH = 250;
    const ANIMATION_DURATION = 250;

    const delayPerBar = ANIMATION_LENGTH / samples;
    
    x.domain([0, samples]);
    const max = d3.max<number>(data.max);

    y.domain([-max / 50, max]);
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
        .attr("class", cn("bar", "top", barClass))
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
        .attr("height", (val, index) => y(val) * botHeight);

    this.oldPos = 0;
    this.updateSvgWidths();
  }

  render (): JSX.Element {
    const {expanded} = this.props;
    return <div className={cn("player-audio", {expanded})}>
      {this.renderContent()}
    </div>
  }
}
