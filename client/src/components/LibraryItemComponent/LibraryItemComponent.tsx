import * as React from 'react';
import * as classnames from 'classnames';
import './LibraryItemComponent.scss';

interface LibraryItemComponentProps {
  layout: 'minimal' | 'compact' | 'medium' | 'large';
  mode?: 'popup' | 'normal';
  onClick?: (evt: MouseEvent) => void;
  theme?: 'dark' | 'light';
  active?: boolean;
  className?: string;
  monitor?: any;
  id: string;
}

const BLANK_IMAGE = 'data:image/png;base64,R0lGODlhFAAUAIAAAP///wAAACH5BAEAAAAALAAAAAAUABQAAAIRhI+py+0Po5y02ouz3rz7rxUAOw==';

export default abstract class LibraryItemComponent<P, S> extends React.Component<LibraryItemComponentProps & P, S> {
  private watcher: any;

  protected image: HTMLImageElement;
  
  abstract loadImage (img: HTMLImageElement): void;

  abstract loadItem (): void;

  abstract unloadItem (): void;

  constructor () {
    super();
    this.state = {} as any;
  }

  componentDidMount() {
    console.log(this.props.monitor, this.image, this.props.id)
    if (!this.props.monitor || this.watcher.isInViewport()) {
      this.loadItem();
      this.loadImage(this.image);
    }
  }

  componentWillReceiveProps (nextProps: LibraryItemComponentProps) {
    console.log('cwrp', this.props.id, nextProps.id, this.image);
    if (nextProps.id !== this.props.id) {
      if (nextProps.id && (!this.props.monitor || this.watcher.isInViewport())) {
        this.loadItem();
        this.loadImage(this.image);
      }
      if (this.props.id && (!this.props.monitor || this.watcher.isInViewport())) {
        this.unloadItem();
      }
    }
  }

  componentWillUnmount() {
    if (!this.props.monitor || this.watcher.isInViewport()) {
      this.unloadItem();
    }
  }

  handleContainerRef(ref: HTMLDivElement) {
    const monitor = this.props.monitor as any;
    if (monitor) {
      const watcher = this.watcher = monitor.create(ref);
      watcher.enterViewport(() => {
        this.loadItem();
        this.loadImage(this.image);
      });
      watcher.exitViewport(() => {
        this.unloadItem();
      });
    }
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
        'clickable': !!this.props.onClick
        })}
        ref={this.handleContainerRef.bind(this)}
        onClick={onClick as any}>
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