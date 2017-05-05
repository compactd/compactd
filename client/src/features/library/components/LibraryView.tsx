import * as React from 'react';
import { connect } from 'react-redux';
import { bindActionCreators, Dispatch } from 'redux';
import { createStructuredSelector } from 'reselect';
import {actions} from '../library';
import {LibraryActions, LibraryAction} from '../actions.d';
import {LibraryState, CompactdState} from 'definitions';
import {ArtistsView} from './ArtistsView';

interface LibraryViewProps {
  actions: LibraryActions;
  library: LibraryState;
  component: any;
}

@(connect as any)(createStructuredSelector({
  library: (state: CompactdState) => state.library
}), (dispatch: Dispatch<LibraryAction>) => ({
  actions: bindActionCreators(actions, dispatch)
}))
class LibraryView extends React.Component<LibraryViewProps, {}> {
  render (): JSX.Element {
    const {library, actions} = this.props;
    const content =  <this.props.component library={library} actions={actions} />;
    return <div>{content}</div>;
  }
}

export default LibraryView as any;
