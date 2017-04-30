import * as React from 'react';
import { connect } from 'react-redux';
import { bindActionCreators, Dispatch } from 'redux';
import { createStructuredSelector } from 'reselect';
import {actions} from '../library';
import {ILibraryActions, ILibraryAction} from '../actions.d';
import {ILibraryState, ICompactdState} from 'definitions';

interface ILibraryViewProps {
  actions: ILibraryActions;
  library: ILibraryState;
}

@(connect as any)(createStructuredSelector({
  library: (state: ICompactdState) => state.library
}), (dispatch: Dispatch<ILibraryAction>) => ({
  actions: bindActionCreators(actions, dispatch)
}))
class LibraryView extends React.Component<ILibraryViewProps, {}> {
  render (): JSX.Element {
    return <div>{(this.props.library.albumsById)['3'].name}</div>;
  }
}

export default LibraryView as any;
