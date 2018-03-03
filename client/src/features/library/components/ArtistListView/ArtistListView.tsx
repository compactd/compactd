import * as React from 'react';
import {LibraryActions} from '../../actions.d';
import {List} from 'react-virtualized';
import { ListProps } from 'react-virtualized/dist/es/List';
import { AlbumComponent } from 'components';
import ArtistComponent from 'components/ArtistComponent/ArtistComponent';
import { artistURI, albumURI } from 'compactd-models/dist';
import { match } from 'react-router';
import * as PropTypes from 'prop-types';
import { filter } from 'fuzzaldrin';
import PlaceholderComponent from 'components/PlaceholderComponent/PlaceholderComponent';
import { Databases } from 'definitions/state';

require('./ArtistListView.scss');

interface ArtistListViewProps {
  actions: LibraryActions;
  items: string[];
  match: match<{artist?: string, album?: string}>;
  filter?: string;
  placeholderState: 'off' | 'on' | 'loading';
  onPlaceholderClick?: Function;
  minimal?: boolean;
  databases: Databases;
}

export class ArtistListView extends React.Component<ArtistListViewProps, {
  height: number,
  width: number
}>{
  static contextTypes = {
    router: PropTypes.shape({
      history: PropTypes.shape({
        push: PropTypes.func.isRequired,
        replace: PropTypes.func.isRequired,
        createHref: PropTypes.func.isRequired
      }).isRequired
    }).isRequired
  }
  private div: HTMLDivElement;
  constructor () {
    super();
    this.state = {height: 0, width: 0};
  }
  computeHeight (div: HTMLDivElement) {
    if (!div) return;
    const windowHeight = Math.max(document.documentElement.clientHeight, window.innerHeight || 0);
    const {top, width} = div.getBoundingClientRect();

    if (top === 0 || width === 0) return;

    const height = windowHeight - top;

    if (height === this.state.height && width === this.state.width) {
      return;
    }

    this.setState({
      height, width
    });
  }
  get items () {
    return filter(this.props.items, this.props.filter).concat(
      this.props.placeholderState === 'loading' ? 'loading-placeholder?' + this.props.filter :
      this.props.placeholderState !== 'off' ? 'placeholder?' + this.props.filter : []
    )
  }
  renderItem (props: ListProps) {
    return <div style={props.style} key={props.key} >
      {this._renderItem(props)}
    </div>;
  }
  _renderItem (props: ListProps) {
    const {index, style, parent} = props;
    const item = this.items[index];
    if (item.startsWith('library/')) {
      const active = artistURI(item).name === this.props.match.params.artist;
      return <ArtistComponent onlyImage={this.props.minimal} active={
                active
              } tooltip={this.props.minimal ? 'on': 'disabled'} onClick={
                this.handleItemClick.bind(this, item, active)
              } id={item} layout="medium" theme="dark" subtitle="counters"
              databases={this.props.databases} />
    } else if (item.startsWith('placeholder?')) {
      const [o, filter] = item.split('?');
      return <PlaceholderComponent 
          id="" 
          layout="medium" 
          theme="dark" 
          loading={false} 
          sub="Click to create a new artist"
          onClick={this.props.onPlaceholderClick as any} 
          header={filter} />
    } else if (item.startsWith('loading-placeholder?')) {
      const [o, filter] = item.split('?');
      return <PlaceholderComponent 
          id="" 
          layout="medium" 
          theme="dark" 
          loading={true} 
          sub="Creating artist"
          header={filter} />
    }
  }
  componentWillReceiveProps (nextProps: ArtistListViewProps) {
    if (nextProps.minimal !== this.props.minimal) { 
      setTimeout(() => {
        this.computeHeight(this.div);
      }, 210);
    }
  }
  
  handleItemClick (item: string, active: boolean, event: MouseEvent) {
    if (
      !event.defaultPrevented && // onClick prevented default
      event.button === 0// && // ignore right clicks
    //  !this.props.target //&& // let browser handle "target=_blank" etc.
      // !isModifiedEvent(event) // ignore clicks with modifier keys
    ) {
      event.preventDefault()

      const { history } = this.context.router

      history.push(active ? '/library' : `/library/${
        artistURI(item).name
      }`);
    }

  }
  componentDidMount () {
    window.addEventListener('resize', (evt) => {
      window.requestAnimationFrame(() => {
        this.computeHeight(this.div);
      })
    });
  }
  render (): JSX.Element {
    const {actions} = this.props;
    console.log('render()', this.props.databases);
    return <div className="artist-list-view" ref={(ref) => {
      this.div = ref;
      this.computeHeight(ref);
    }}>
      <List
        __filter={this.props.filter}
        height={this.state.height}
        rowHeight={80}
        rowCount={this.items.length}
        width={this.state.width}
        rowRenderer={this.renderItem.bind(this)} />
    </div>
  }
}