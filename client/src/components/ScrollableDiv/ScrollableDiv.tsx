import * as React from 'react'
import './ScrollableDiv.scss';
import * as classnames from 'classnames';

class ScrollableDiv extends React.Component<{
  offset?: number;
  className?: string;
  binding?: any;
  divRef?: (div: HTMLDivElement) => void;
},{}> {
  private div: HTMLDivElement;
  componentDidMount () {
    window.addEventListener('resize', this.onResize);
    this.updateHeight();
    setTimeout(() => {
      this.updateHeight()
    }, 100);
  }
  componentWillUnmount () {
    window.removeEventListener('resize', this.onResize);
  }
  onResize () {
    window.requestAnimationFrame(() => {
      this.updateHeight();
    })
  }
  componentWillReceiveProps () {
    this.updateHeight();
  }
  updateHeight () {
    this.div.style.height =
      (window.innerHeight
        - this.div.getBoundingClientRect().top
        + (this.props.offset || 0)
        - this.div.parentElement.scrollTop) + "px";
  }
  componentDidUpdate () {
    this.updateHeight();
  }
  render () {
    return <div ref={(ref) =>{
      this.div = ref;
      if (this.props.divRef) this.props.divRef(ref);
    }} className={
        classnames("scrollable-div", this.props.className || '')
      }>
      {this.props.children}
    </div>
  }
}

export default ScrollableDiv;
