import * as React from 'react';
import { connect } from 'react-redux';
import { bindActionCreators, Dispatch } from 'redux';
import { createStructuredSelector } from 'reselect';
import {actions} from '../library';
import {ILibraryActions, ILibraryAction} from '../actions.d';
import {ILibraryState, ICompactdState} from 'definitions';
import {ArtistsView} from './ArtistsView';

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
    const {library, actions} = this.props;
    const content = <ArtistsView artists={library.artists} actions={actions} />;
    return <div>{content}</div>;
  }
}

export default LibraryView as any;
