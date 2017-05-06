import * as React from 'react';
import { connect } from 'react-redux';
import { bindActionCreators, Dispatch } from 'redux';
import { createStructuredSelector } from 'reselect';
import {actions} from '../library';
import {LibraryActions, LibraryAction} from '../actions.d';
import {LibraryState, CompactdState} from 'definitions';
import {ArtistsView} from './ArtistsView';
import {match} from 'react-router';
import { withRouter } from 'react-router-dom';

interface LibraryViewProps {
  actions: LibraryActions;
  library: LibraryState;
  component: any;
  match: match<{artist: string}>;
}

const mapStateProps = createStructuredSelector({
  library: (state: CompactdState) => state.library,
  location: (state: any) => state.location
});

const mapActions = (dispatch: Dispatch<LibraryAction>) => ({
  actions: bindActionCreators(actions, dispatch)
});

class LibraryView extends React.Component<LibraryViewProps, {}> {
  componentWillReceiveProps (props: any) {
  }
  render (): JSX.Element {
    const {library, actions} = this.props;
    const content =  <this.props.component library={library} actions={actions}
        match={(this.props as any).match}/>;
    return <div>{content}</div>;
  }
}

export default withRouter(
  (connect as any)(mapStateProps, mapActions)(LibraryView as any)
);
