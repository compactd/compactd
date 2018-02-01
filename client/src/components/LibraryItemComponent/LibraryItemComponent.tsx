import * as React from 'react';
import * as classnames from 'classnames';
import './LibraryItemComponent.scss';
import {EventEmitter} from 'eventemitter3';

interface LibraryItemComponentProps {
  layout: 'minimal' | 'compact' | 'medium' | 'large';
  mode?: 'popup' | 'normal';
  onClick?: (evt: MouseEvent) => void;
  theme?: 'dark' | 'light';
  active?: boolean;
  className?: string;
  id: string;
  emitter?: EventEmitter;
  hash?: string;
  index?: number;
  visible?: boolean;
}

const BLANK_IMAGE = 'data:image/png;base64,R0lGODlhFAAUAIAAAP///wAAACH5BAEAAAAALAAAAAAUABQAAAIRhI+py+0Po5y02ouz3rz7rxUAOw==';

export default abstract class LibraryItemComponent<P, S> extends React.Component<LibraryItemComponentProps & P, S> {
  private watcher: any;
  private loaded: boolean = false;

  protected image: HTMLImageElement;
  
  abstract loadImage (id: string, img: HTMLImageElement): void;

  abstract loadItem (id: string): void;

  abstract unloadItem (): void;

  constructor () {
    super();
    this.state = {} as any;
  }

  componentDidMount() {
    if (!this.props.emitter || this.props.visible) {
      this.loaded = true;
      this.loadItem(this.props.id);
      this.loadImage(this.props.id, this.image);
      return;
    }

    this.props.emitter.on(`show-${this.props.hash}-${this.props.index}`, () => {
      this.loaded = true;
      this.loadItem(this.props.id);
      this.loadImage(this.props.id, this.image);
    });
    this.props.emitter.on(`hide-${this.props.hash}-${this.props.index}`, () => {
      this.loaded = false;
      this.unloadItem();
    });
  }
  
  handleMouseOver() {
    if (this.loaded) return;

    this.loadItem(this.props.id);
    this.loadImage(this.props.id, this.image);
  }

  componentWillReceiveProps (nextProps: LibraryItemComponentProps) {
    if (nextProps.id !== this.props.id && (!this.props.emitter || this.props.visible)) {
      if (nextProps.id) {
        this.loaded = true;
        this.loadItem(nextProps.id);
        this.loadImage(nextProps.id, this.image);
        return;
      }
      if (this.props.id) {
        this.loaded = true;
        this.unloadItem();
      }
    }

    if (nextProps.hash !== this.props.hash) {
      this.props.emitter.on(`show-${nextProps.hash}-${nextProps.index}`, () => {
        this.loaded = true;
        this.loadItem(this.props.id);
        this.loadImage(this.props.id, this.image);
      });
      this.props.emitter.on(`hide-${nextProps.hash}-${nextProps.index}`, () => {
        this.loaded = false;
        this.unloadItem();
      });
    }
  }

  componentWillUnmount() {}
  
  getImageSizings (): 'large' | 'small' {
    switch (this.props.layout) {
      case 'minimal': return null;
      case 'compact': 
        return 'small';
      case 'medium':
        return 'large';
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
  renderImage (): JSX.Element {
    const size = this.getImageSize();
    return <img width={size} height={size} 
    src={BLANK_IMAGE} ref={(ref) => {
      this.image = ref;
    }} />;
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
          'pt-dark': this.props.theme === 'dark'
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