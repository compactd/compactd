import * as React from "react";
import { connect } from 'react-redux';
import { bindActionCreators, Dispatch } from 'redux';
import { createStructuredSelector } from 'reselect';

import {Artist, DSArtist, artistURI} from 'compactd-models';
import ArtistComponent from 'components/ArtistComponent';
import { Select } from "@blueprintjs/labs";
import { MenuItem } from "@blueprintjs/core";
import {actions} from '../../features/library/library';
import {LibraryActions, LibraryAction} from '../../features/library/actions.d';
import {LibraryState, CompactdState, PlayerState} from 'definitions';
import './Sandbox.scss';

interface SandboxProps {
  library: LibraryState;
  actions: LibraryActions;
};

interface SandboxState {
  type: 'artist' | 'album' | 'track';
  artist: {
    name: string;
    cover?: string;
    largeCover?: string;
  } & Partial<Artist> & Partial<DSArtist> & any;
  layout: 'minimal' | 'compact' | 'medium' | 'large';
  theme: 'dark' | 'light';
  subtitle: 'counters' | 'bio' | 'none';
  active: boolean;
};

const mapStateProps = createStructuredSelector({
  library: (state: CompactdState) => state.library,
});

const mapActions = (dispatch: Dispatch<LibraryAction>) => ({
  actions: bindActionCreators(
    Object.assign({}, actions), dispatch)
});
@(connect as any)(mapStateProps, mapActions)
class Sandbox extends React.Component<SandboxProps, SandboxState> {
  constructor() {
    super();
    this.state = {
      type: 'artist',
      artist: {name: 'My Artist'},
      layout: 'medium',
      theme: 'dark',
      subtitle: 'none',
      active: false
    };
  }
  renderComponent() {
    switch (this.state.type) {
      case 'artist': return <ArtistComponent artist={this.state.artist} layout={this.state.layout} theme={this.state.theme} subtitle={this.state.subtitle} />
    }
  }
  componentDidMount() {
    this.props.actions.fetchAllArtists();
  }
  handleSelectChange(prop: string) {
    return (evt: React.ChangeEvent<HTMLSelectElement>) => {
      this.setState({
        [prop]: evt.target.value
      } as any);
    }
  }
  public render(): JSX.Element {
      return <div className="sandbox-container">
        <div className="sandbox-header">Welcome to the sandbox</div>
        <div className="sandbox-content">
          <div className="sandbox-controls">
            <label className="type pt-label">
              Component type
              <div className="pt-select">
                <select name="component-type" id="component-type" value={this.state.type} onChange={this.handleSelectChange('type')}>
                  <option value="artist">Artist</option>
                  <option value="album">Album</option>
                  <option value="track">Track</option>
                </select>
              </div>
            </label>
            <label className="layout pt-label">
              Component layout
              <div className="pt-select">
                <select name="component-layout" id="component-layout" value={this.state.layout} onChange={this.handleSelectChange('layout')}>
                  <option value="minimal">Minimal</option>
                  <option value="compact">Compact</option>
                  <option value="medium">Medium</option>
                  <option value="large">Large</option>
                </select>
              </div>
            </label>
            <label className="theme pt-label">
              Component theme
              <div className="pt-select">
                <select name="component-theme" id="component-theme" value={this.state.theme} onChange={this.handleSelectChange('theme')}>
                  <option value="light">Light</option>
                  <option value="dark">Dark</option>
                </select>
              </div>
            </label>
            <label className="subtitle pt-label">
              Component subtitle
              <div className="pt-select">
                <select name="component-subtitle" id="component-subtitle" value={this.state.subtitle} onChange={this.handleSelectChange('subtitle')}>
                  <option value="bio">Bio</option>
                  <option value="counters">Counters</option>
                </select>
              </div>
            </label>
          </div>
          <div className="sandbox-component">
            <div className="component" style={{backgroundColor: this.state.theme === 'light' ? '#fff' : 'rgb(60, 56, 72)'}}>
              {this.renderComponent()}
            </div>
          </div>
          <div className="sandbox-selects">
            {this.renderSelects()}
          </div>
        </div>
      </div>
  }
  private renderArtist ({ handleClick, isActive, item }: any) {
    return <MenuItem text={item.name} onClick={handleClick} disabled={isActive} key={item._id}/>
  }
  private renderSelects() {
    const ArtistSelect = Select.ofType<Artist>();
    return <ArtistSelect itemRenderer={this.renderArtist} items={this.props.library.artists} onItemSelect={(item) => {
      this.setState({artist: item});
    }}/>;
  }
}
export default Sandbox;