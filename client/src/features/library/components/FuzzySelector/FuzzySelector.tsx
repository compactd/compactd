import * as React from 'react';
import {LibraryActions} from '../../actions.d';
import {Omnibox, ISelectItemRendererProps} from '@blueprintjs/labs';
import {HotkeysTarget, Hotkey, Hotkeys, MenuItem} from '@blueprintjs/core';
import {Artist, Album, Track, artistURI, albumURI, trackURI} from 'compactd-models';
import AlbumComponent from 'components/AlbumComponent';
import ArtistComponent from 'components/ArtistComponent';
import {filter} from 'fuzzaldrin';
import {LibraryState} from 'definitions';
import * as PropTypes from 'prop-types';
import {PlayerActions} from '../../../player/actions.d';

require('./FuzzySelector.scss');

interface FuzzySelectorProps {
  actions: LibraryActions & PlayerActions;
  library: LibraryState;
}

type  LibraryContent = string;

const ContentOmnibox = Omnibox.ofType<LibraryContent>();
@HotkeysTarget
export class FuzzySelector extends React.Component<FuzzySelectorProps, {
  isOpen?: boolean
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
  constructor () {
    super();
    this.state = {};
  }
  renderHotkeys () {
    return (<Hotkeys>
      <Hotkey 
        allowInInput={false} 
        global={true} 
        combo="ctrl + p" 
        label="Show omnibox" 
        onKeyDown={(evt) => {
          evt.preventDefault();
          evt.stopPropagation();
          this.setState({
            isOpen: true
          })
        }}/>
      <Hotkey 
        allowInInput={false} 
        global={true} 
        combo="meta + p" 
        label="Show omnibox" 
        onKeyDown={(evt) => {
          evt.preventDefault();
          evt.stopPropagation();
          this.setState({
            isOpen: true
          })
        }}/>
    </Hotkeys>)
  }
  private renderLibraryContent ({ handleClick, isActive, item }: ISelectItemRendererProps<LibraryContent>) {
    // if (this.isTrack(item)) {

    //   return <MenuItem className={isActive ? 'pt-active' : ''} iconName="music" text={track.name} onClick={handleClick} key={item._id}/>
    // }
    if (this.isAlbum(item)) {
      return <AlbumComponent id={item} active={isActive} layout="compact" onClick={handleClick as any} key={item} />;
    }
    return <ArtistComponent id={item} active={isActive} layout="compact" onClick={handleClick as any} key={item} />;

  }
  private filterLibraryContent (query: string, items: LibraryContent[]) {
    return filter(items, query).slice(0, 15);
  }
  componentDidMount () {
    this.props.actions.fetchAllAlbums();
    this.props.actions.fetchAllArtists();
    this.props.actions.fetchAllTracks();
  }
  handleItemSelect (item: LibraryContent, event: React.SyntheticEvent<HTMLElement>) {
    const { history } = this.context.router;
    this.handleClose();
    if (this.isTrack(item)) {
      
      this.props.actions.replacePlayerStack([item, trackURI(item).number]);
      return
    }
    if (this.isAlbum(item)) {

      history.push(`/library/${
        albumURI(item).artist
      }/${
        albumURI(item).name
      }`);
      return
    }

    history.push(`/library/${
      artistURI(item).name
    }`);

  }
  private isAlbum(item: string) {
    return item.split('/').length === 3;
  }

  private isTrack(item: string) {
    return item.split('/').length === 5;
  }

  handleClose () {
    this.setState({isOpen: false});
  }
  render (): JSX.Element {
    const {actions, library} = this.props;
    const items = [].concat(library.albums).concat(library.artists).concat(library.tracks);
    return <div className="fuzzy-selector">
      <ContentOmnibox
        resetOnSelect={true}
        itemRenderer={this.renderLibraryContent.bind(this)}
        isOpen={this.state.isOpen}
        items={items}
        noResults={<MenuItem disabled={true} text="No results." />}
        onItemSelect={this.handleItemSelect.bind(this)}
        itemListPredicate={this.filterLibraryContent.bind(this)}
        onClose={this.handleClose.bind(this)}
        />
    </div>
  }
}