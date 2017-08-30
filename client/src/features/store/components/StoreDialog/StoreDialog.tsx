import * as React from 'react';
import {StoreActions} from '../../actions.d';
import {Dialog, Button, Intent, Spinner} from '@blueprintjs/core';
import {StoreState} from 'definitions';
import {ResultItem} from '../ResultItem';

require('./StoreDialog.scss');

interface StoreDialogProps {
  actions: StoreActions;
  store: StoreState;
}

export class StoreDialog extends React.Component<StoreDialogProps, {query: string}>{
  constructor () {
    super();
    this.state = {query: ''};
  }
  getDialogContent () {
    const {store, actions} = this.props;
    if (!store.search) return <div></div>;
    const results = store.searchResultsByQuery[store.search];
    if (!results)
      return <Spinner />;
    
    if (!results.artist.length && !results.album.length && !results.track.length) {
      return <div className="pt-non-ideal-state">
        <div className="pt-non-ideal-state-visual pt-non-ideal-state-icon">
          <span className="pt-icon pt-icon-cross"></span>
        </div>
        <h4 className="pt-non-ideal-state-title">No result</h4>
        <div className="pt-non-ideal-state-description">
          We couldn't find what your were looking for...
        </div>
      </div>
    }

    return <div className="results">
      <div className="artist-results">
        <span className="result-header">ARTISTS</span>
        {results.artist.map((el) => <ResultItem actions={actions} item={el} />)}
      </div>
      <div className="album-results">
        <span className="result-header">ALBUMS</span>
        {results.album.map((el) => <ResultItem actions={actions} item={el} />)}
      </div>
      <div className="result-results">
        <span className="result-header">TRACKS</span>
        {results.track.map((el) => <ResultItem actions={actions} item={el} />)}
      </div>
    </div>
  }
  render (): JSX.Element {
    const {actions, store} = this.props;
    return <div className="store-dialog">
      <Dialog iconName="geosearch" isOpen={store.showSearchDialog} title="Download" onClose={() => actions.toggleSearch()}>
        <div className="pt-dialog-body">
          <div className="search-box">
            <div className="pt-input-group">
              <span className="pt-icon pt-icon-search"></span>
              <input className="pt-input" type="search" placeholder="Search msuic" dir="auto" value={this.state.query} onChange={
                (evt) => this.setState({
                  query: evt.target.value
                })
              } />
            </div>
          </div>
          <div className="dialog-content">
            {this.getDialogContent()}
          </div>
        </div>
        <div className="pt-dialog-footer">
          <div className="pt-dialog-footer-actions">
            <Button text="Secondary" />
            <Button
              intent={Intent.PRIMARY}
              onClick={() => actions.searchDatasource(this.state.query)}
              text="Search"
            />
          </div>
        </div>
      </Dialog>
    </div>
  }
}