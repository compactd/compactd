import * as React from 'react';
import { connect } from 'react-redux';
import { bindActionCreators, Dispatch } from 'redux';
import { createStructuredSelector } from 'reselect';
import {actions} from '../store';
import {StoreActions, StoreAction} from '../actions.d';
import {StoreState, CompactdState} from 'definitions';
import {StoreButton} from './StoreButton';

interface StoreViewProps {
  actions: StoreActions;
  store: StoreState;
}

@(connect as any)(createStructuredSelector({
  store: (state: CompactdState) => state.store
}), (dispatch: Dispatch<StoreAction>) => ({
  actions: bindActionCreators(actions, dispatch)
}))
class StoreView extends React.Component<StoreViewProps, {}> {
  render (): JSX.Element {
    return <div className="store-view">
      <StoreButton store={this.props.store} actions={this.props.actions} />
    </div>;
  }
}

export default StoreView as any;