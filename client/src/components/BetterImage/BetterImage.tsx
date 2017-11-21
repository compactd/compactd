import * as React from 'react';
import * as classnames from 'classnames';

import Session from 'app/session';

interface BetterImageProps {
  divClassName?: string;
  className?: string;
  fallback?: string;
  height?: number;
  width?: number;
  size?: number;
  key?: string | number;
  src: string | Blob | Promise<Blob | string>;
}
const BLANK_IMAGE = 'data:image/png;base64,R0lGODlhFAAUAIAAAP///wAAACH5BAEAAAAALAAAAAAUABQAAAIRhI+py+0Po5y02ouz3rz7rxUAOw==';


const blobs: any = {};
let loader = '';

function fetchLoader (): Promise<string> {
  if (loader) return Promise.resolve(loader);
  return fetch('/api/assets/oval-min.svg', Session.init()).then((res) => res.text())
    .then((svg) => {
    return `data:image/svg+xml;utf8,${svg}`;
  });
}

export default class BetterImage extends React.Component<BetterImageProps, {loading: boolean}> {
  private image: HTMLImageElement;
  constructor () {
    super();
    this.state = {loading: true};
  }
  fetchImage (current = this.props.src, check = true) {
    this.setState({loading: true});
    if (typeof current === 'string' && !current.startsWith('blob:')) {
      if (current.startsWith('/api/')) {
        fetch(current, {
          method: 'GET',
          headers: Session.headers()
        }).then((res) => {
            return res.blob();
        }).then((blob) => {
          if (!this.image) return;
          if (blob.size < 10) throw new Error();
          // Then the src prop has changed during the request - dont udpate!
          if (current !== this.props.src && check) return;
          let url = URL.createObjectURL(blob);
          // blobs[this.props.src] = url;
          this.image.src = url;
    
          this.setState({loading: false});
        }).catch((err) => {
          const fallback = this.props.fallback || '/api/assets/no-album.jpg';
          this.fetchImage(fallback, false);
          this.setState({loading: false});
        });

      }
      this.image.src = current;
    } else {
      Promise.resolve(current).then((blob) => {
        
        if (typeof blob === 'string') {
          this.image.src = blob;
          
          this.setState({loading: false});
          return;
        }
        this.image.src = URL.createObjectURL(blob);
        
        this.setState({loading: false});
      }).catch((err) => {
        console.log('err', err);
        const fallback = this.props.fallback || '/api/assets/no-album.jpg';
        this.fetchImage(fallback, false);
      });
    }
  }
  componentWillUnmount () {
    URL.revokeObjectURL(this.image.src);
  }
  componentDidMount () {
    this.image.onerror = () => {
      // this.image.src = ;:
      const fallback = this.props.fallback || '/api/assets/no-album.jpg';
      this.fetchImage(fallback, false);
    }
    if (this.props.src) {
      this.fetchImage();
    }
    fetchLoader().then((svg) => {
      // this.image.style.backgroundImage = `url('${svg}')`;
    })
  }
  componentWillReceiveProps (nextProps: BetterImageProps) {
    if (nextProps.src && this.props.src !== nextProps.src) {
      this.image.src = BLANK_IMAGE;
      this.image.src && URL.revokeObjectURL(this.image.src);
      this.fetchImage(nextProps.src);
    }
  }
  render() {
    return (
      <div className={classnames('image-container', this.props.divClassName)} key={this.props.key}>
        <img draggable={false} className={classnames('better-image', this.props.className, {
          'pt-skeleton': this.state.loading
        })} ref={
            (ref) => this.image = ref
          } style={{
            backgroundRepeat: 'no-repeat',
            backgroundPosition: 'center center',
            display: 'block',
            height: `${this.props.height || this.props.size || 128}px`,
            width: `${this.props.width || this.props.size || 128}px`,
          }} src={BLANK_IMAGE}/>
      </div>
    );
  }
}
