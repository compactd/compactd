import { remoteActions } from 'app/actions/remote';
import { IRemoteState, IRootState } from 'app/reducers/state';
import { getFactoryFromState } from 'app/utils';
import * as React from 'react';
import { connect } from 'react-redux';
import { AnyAction, bindActionCreators, Dispatch } from 'redux';
import styled from 'styled-components';

// const { Circle } = require('react-progressbar.js');

const Root = styled.div`
  background-color: red;
`;

@connect(
  ({ remote }: IRootState) => {
    return { remote };
  },
  (dispatch: Dispatch<AnyAction, any>) => ({
    actions: bindActionCreators(remoteActions, dispatch)
  })
)
export default class SplashProxy extends React.Component<{
  remote: IRemoteState;
  actions: typeof remoteActions;
}> {
  public componentDidMount() {
    const { actions, remote } = this.props;
    actions.fetchStatus(getFactoryFromState(remote));
  }

  public render() {
    // tslint:disable-next-line:no-console
    console.log(this);

    return <Root>{this.props.remote.status}</Root>;
  }
}
