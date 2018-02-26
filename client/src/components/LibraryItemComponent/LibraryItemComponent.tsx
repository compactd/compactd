import * as React from 'react';
import * as classnames from 'classnames';
import './LibraryItemComponent.scss';
import {EventEmitter} from 'eventemitter3';
import * as ReactDOM from 'react-dom';
import Map from 'models/Map';
import Artwork from 'app/Artwork';

interface LibraryItemComponentProps {
  layout: 'minimal' | 'compact' | 'medium' | 'large';
  mode?: 'popup' | 'normal';
  onClick?: (evt: MouseEvent) => void;
  theme?: 'dark' | 'light';
  active?: boolean;
  className?: string;
  id: string;
  index?: number;
  onlyImage?: boolean;
}

const BLANK_IMAGE = 'data:image/png;base64,R0lGODlhFAAUAIAAAP///wAAACH5BAEAAAAALAAAAAAUABQAAAIRhI+py+0Po5y02ouz3rz7rxUAOw==';

export default abstract class LibraryItemComponent<P, S> extends React.Component<LibraryItemComponentProps & P, S> {
  private imageContainer: HTMLDivElement;
  private loaded: boolean = false;

  protected images: Map<HTMLImageElement> = {};
  
  abstract loadImage (id: string, img: HTMLImageElement): void;

  abstract loadItem (id: string): void;

  abstract unloadItem (): void;

  constructor () {
    super();
    this.state = {} as any;
  }

  componentDidMount() {
    if (this.props.id) {
      this.loaded = true;
      this.loadItem(this.props.id);
      this.attachImage(this.props.id);
    }
    return;
  }
  
  handleMouseOver() {
    if (this.loaded) return;

    // this.loadItem(this.props.id);
    // this.loadImage(this.props.id, this.image);
  }

  componentWillReceiveProps (nextProps: LibraryItemComponentProps) {
    if (nextProps.id !== this.props.id) {
      if (this.props.id) {
        this.loaded = false;
        this.unloadItem();
        this.detachImage(this.props.id);
      }
      if (nextProps.id) {
        this.loaded = true;
        this.loadItem(nextProps.id);
        this.attachImage(nextProps.id);
        //this.loadImage(nextProps.id, this.image);
        return;
      }
    }
  }

  componentWillUnmount() {
    this.loaded = false;
    this.unloadItem();
    this.detachImage(this.props.id);
  }
  
  getImageSizings (): 'large' | 'small' {
    switch (this.props.layout) {
      case 'minimal': return null;
      case 'compact': 
        return 'small';
      case 'medium':
        return 'small';
      case 'large':
        return 'large';
    }
  }

  getImageSize (): number {
    switch (this.props.layout) {
      case 'minimal': return 0;
      case 'compact': 
        return 32;
      case 'medium':
        return 56;
      case 'large':
        return 128;
    }
  }

  attachImage (id: string) {
    if (this.images[id] && document.contains(this.images[id])) {
      return this.loadImage(id, this.images[id]);
    }
    const size = this.getImageSize();
    const node = document.createElement('img');
    node.src = BLANK_IMAGE;
    node.width = size;
    node.setAttribute('data-doc-id', "artworks/" + id);

    if (!this.imageContainer || !document.contains(this.imageContainer)) {
      return;
    }

    this.imageContainer.appendChild(node);
    this.loadImage(id, node);

    this.images[id] = node;
  }

  detachImage (id: string) {
    if (!id) return;
    const node = this.images[id];
    if (!node || !document.contains(node)) {
      return;
    }
    this.imageContainer.removeChild(node);
  } 

  renderImage (): JSX.Element {
    const size = this.getImageSize();
    return <div className="images-container" ref={(ref) => this.imageContainer = ref}></div>
    // return <img width={size} height={size} 
    // src={BLANK_IMAGE} ref={(ref) => {
    //   this.image = ref;
    // }} data-doc-id={"artworks/" + this.props.id} />;
  }

  abstract getClassNames(): string[];

  abstract renderSubtitle (): JSX.Element | string;
  
  abstract renderHeader (): JSX.Element | string;

  render () {
    const {
      layout,
      mode = 'normal',
      onClick = new Function(),
      theme = 'light',
      className = '',
      active = false,
    } = this.props;


    return <div className={classnames(className,
      'item-component',
      `${theme}-theme`,
      `${layout}-layout`,
      ...this.getClassNames(),
          {active,
          'clickable': !!this.props.onClick,
          'pt-dark': this.props.theme === 'dark',
          'hide-text': this.props.onlyImage
        })}
        onClick={onClick as any}
        onMouseOver={this.handleMouseOver.bind(this)}>
      <div className="item-image">{this.renderImage()}</div>
      <div className="item-props">
        <div className="item-name">
          {this.renderHeader()}
        </div>
        <div className="item-subtitle">
          {this.renderSubtitle()}
        </div>
      </div>
    </div>
  }

}