import * as React from 'react';
import { connect } from 'react-redux';
import { bindActionCreators, Dispatch } from 'redux';
import { createStructuredSelector } from 'reselect';
import {actions} from '../library';
import {LibraryActions, LibraryAction} from '../actions.d';
import {PlayerActions} from '../../player/actions.d';
import {actions as playerActions} from '../../player';
import {LibraryState, CompactdState, PlayerState} from 'definitions';
import {ArtistsView} from './ArtistsView';
import {match} from 'react-router';
import { withRouter } from 'react-router-dom';

interface LibraryViewProps {
  actions: LibraryActions & PlayerActions;
  library: LibraryState;
  player: PlayerState;
  component: any;
  match: match<{artist: string}>;
  all: boolean;
  _store: boolean;
}

const mapStateProps = createStructuredSelector({
  library: (state: CompactdState) => state.library,
  location: (state: any) => state.location,
  player: (state: CompactdState) => state.player
});

const mapActions = (dispatch: Dispatch<LibraryAction>) => ({
  actions: bindActionCreators(
    Object.assign({}, actions, playerActions), dispatch)
});

class LibraryView extends React.Component<LibraryViewProps, {}> {
  componentWillReceiveProps (props: any) {
  }
  render (): JSX.Element {
    const {library, actions, player} = this.props;
    const content =  <this.props.component library={library} actions={actions}
        match={(this.props as any).match} all={this.props.all} _store={this.props._store} player={player}/>;
    return <div>{content}</div>;
  }
}

export default withRouter(
  (connect as any)(mapStateProps, mapActions)(LibraryView as any)
);
