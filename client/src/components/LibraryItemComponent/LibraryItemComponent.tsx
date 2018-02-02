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
  index?: number;
  onlyImage?: boolean;
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
    this.loaded = true;
    this.loadItem(this.props.id);
    this.loadImage(this.props.id, this.image);
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
      }
      if (nextProps.id) {
        this.loaded = true;
        this.loadItem(nextProps.id);
        this.loadImage(nextProps.id, this.image);
        return;
      }
    }
  }

  componentWillUnmount() {
    this.loaded = false;
    this.unloadItem();
  }
  
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
    }} data-doc-id={"artworks/" + this.props.id} />;
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