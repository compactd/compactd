import * as React from 'react';
import * as classnames from 'classnames';

interface BetterImageProps {
  divClassName?: string;
  className?: string;
  height?: number;
  width?: number;
  size?: number;
  key?: string | number;
  src: string;
}
const blobs: any = {};
export default class BetterImage extends React.Component<BetterImageProps, {}> {
  private image: HTMLImageElement;
  fetchImage (current = this.props.src) {
    // if (!window.sessionStorage.getItem('session_token'))
    //   setTimeout(() => this.fetchImage(), 500);

    // if (blobs[this.props.src]) {
    //   this.image.src = blobs[this.props.src];
    // }
    fetch(current, {
      headers: {
        'Authorization': 'Bearer ' + window.sessionStorage.getItem('session_token')
    }}).then((res) => res.blob())
      .then((blob) => {
      // Then the src prop has changed during the request - dont udpate!
      if (current !== this.props.src) return;
      let url = URL.createObjectURL(blob);
      // blobs[this.props.src] = url;
      this.image.src = url;
    });
  }
  componentDidMount () {
    // this.image.onerror = () => {
    //   const fallback = this.props.fallback || '/api/v2/assets/no-album.jpg';
    //   if (this.image.src !== fallback) {
    //     this.image.src = fallback;
    //   }
    // }
    if (this.props.src) {
      this.fetchImage();
    }
  }
  componentWillReceiveProps (nextProps: BetterImageProps) {
    if (nextProps.src && this.props.src !== nextProps.src) {
      this.image.src && URL.revokeObjectURL(this.image.src);
      this.image.src = '';
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
            backgroundImage: `url(/api/v2/assets/oval-min.svg)`,
            backgroundRepeat: 'no-repeat',
            backgroundPosition: 'center center',
            backgroundColor: `#484d5c`,
            display: 'block',
            height: `${this.props.height || this.props.size || 128}px`,
            width: `${this.props.width || this.props.size || 128}px`,
          }}/>
      </div>
    );
  }
}
