import * as React from 'react';
import * as classnames from 'classnames';

interface BetterImageProps {
  divClassName?: string;
  className?: string;
  fallback?: string;
  height?: number;
  width?: number;
  size?: number;
  key?: string | number;
  src: string;
}
// data:image/svg+xml;utf8,
const blobs: any = {};
let loader = '';

function fetchLoader (): Promise<string> {
  if (loader) return Promise.resolve(loader);
  return fetch('/api/assets/oval-min.svg', {
    headers: {
      'Authorization': 'Bearer ' + window.sessionStorage.getItem('session_token')
  }}).then((res) => res.text())
    .then((svg) => {
    return `data:image/svg+xml;utf8,${svg}`;
  });
}

export default class BetterImage extends React.Component<BetterImageProps, {}> {
  private image: HTMLImageElement;

  fetchImage (current = this.props.src, check = true) {
    // if (!window.sessionStorage.getItem('session_token'))
    //   setTimeout(() => this.fetchImage(), 500);

    // if (blobs[this.props.src]) {
    //   this.image.src = blobs[this.props.src];
    // }
    fetch(current, {
      headers: {
        'Authorization': 'Bearer ' + window.sessionStorage.getItem('session_token')
    }}).then((res) => {
      return res.blob();
    }).then((blob) => {
      if (blob.size < 10) throw new Error();
      // Then the src prop has changed during the request - dont udpate!
      if (current !== this.props.src && check) return;
      let url = URL.createObjectURL(blob);
      // blobs[this.props.src] = url;
      this.image.src = url;
    }).catch((err) => {
      const fallback = this.props.fallback || '/api/assets/no-album.jpg';
      this.fetchImage(fallback, false);
    });
  }
  componentDidMount () {
    this.image.onerror = () => {
      const fallback = this.props.fallback || '/api/assets/no-album.jpg';
      this.fetchImage(fallback, false);
    }
    if (this.props.src) {
      this.fetchImage();
    }
    fetchLoader().then((svg) => {
      this.image.style.backgroundImage = `url('${svg}')`;
    })
  }
  componentWillReceiveProps (nextProps: BetterImageProps) {
    if (nextProps.src && this.props.src !== nextProps.src) {
      this.image.src = 'data:image/png;base64,R0lGODlhFAAUAIAAAP///wAAACH5BAEAAAAALAAAAAAUABQAAAIRhI+py+0Po5y02ouz3rz7rxUAOw==';
      // this.image.src && URL.revokeObjectURL(this.image.src);
      this.fetchImage(nextProps.src);
    }
  }
  render() {
    return (
      <div className={classnames('image-container', this.props.divClassName)}
        key={this.props.key}>
        <img className={classnames('better-image', this.props.className)} ref={
            (ref) => this.image = ref
          } style={{
            backgroundRepeat: 'no-repeat',
            backgroundPosition: 'center center',
            backgroundColor: `#484d5c`,
            display: 'block',
            height: `${this.props.height || this.props.size || 128}px`,
            width: `${this.props.width || this.props.size || 128}px`,
          }} src="data:image/png;base64,R0lGODlhFAAUAIAAAP///wAAACH5BAEAAAAALAAAAAAUABQAAAIRhI+py+0Po5y02ouz3rz7rxUAOw=="/>
      </div>
    );
  }
}
