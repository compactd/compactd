import * as React from 'react';
import {LibraryActions} from '../../actions.d';
import {Omnibox, ISelectItemRendererProps} from '@blueprintjs/labs';
import {HotkeysTarget, Hotkey, Hotkeys, MenuItem} from '@blueprintjs/core';
import {Artist, Album, Track, artistURI, albumURI} from 'compactd-models';
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

type  LibraryContent = Artist | Album | Track;

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
        combo="meta + k" 
        label="Show omnibox" 
        onKeyDown={() => {
          this.setState({
            isOpen: true
          })
        }}/>
    </Hotkeys>)
  }
  private renderLibraryContent ({ handleClick, isActive, item }: ISelectItemRendererProps<LibraryContent>) {
    if (item.album) {
      const track = item as Track;

      return <MenuItem className={isActive ? 'pt-active' : ''} iconName="music" text={track.name} onClick={handleClick} key={item._id}/>
    }
    if (item.artist) {
      const album = item as Album;
      return <AlbumComponent album={album} active={isActive} layout="compact" onClick={handleClick as any} key={item._id} />;
    }
    return <ArtistComponent artist={item} active={isActive} layout="compact" onClick={handleClick} key={item._id} />;

  }
  private filterLibraryContent (query: string, items: LibraryContent[]) {
    return filter(items, query, {key: 'name'});
  }
  componentDidMount () {
    this.props.actions.fetchAllAlbums();
    this.props.actions.fetchAllArtists();
    this.props.actions.fetchAllTracks();
  }
  handleItemSelect (item: LibraryContent, event: React.SyntheticEvent<HTMLElement>) {
    const { history } = this.context.router;
    this.handleClose();
    if (item.album) {
      const track = item as Track;
      
      this.props.actions.replacePlayerStack([track.album, track.number]);
      return
    }
    if (item.artist) {
      const album = item as Album;

      history.push(`/library/${
        albumURI(item._id).artist
      }/${
        albumURI(item._id).name
      }`);
      return
    }

    history.push(`/library/${
      artistURI(item._id).name
    }`);

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
        itemRenderer={this.renderLibraryContent}
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