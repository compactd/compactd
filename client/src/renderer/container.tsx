import { Component } from "react";
import {CompactdStore} from '../app/CompactdStore';
import { CompactdApplication } from 'app/CompactdApplication';
import { TitleBar } from 'renderer/TitleBar/TitleBar';
import { CompactdState } from "definitions";
import { Store } from "redux";
import * as React from "react";

const origin = new URL('https://compactd.whitedrop.pw');

interface Props {store: Store<CompactdState>}

export class ElectronContainer extends Component<Props, {loading: boolean}> {
  constructor () {
    super();
    this.state = {loading: true};
  }
  private handleStore({store}: Props = this.props) {
    if (store) {
      store.subscribe(() => {
        const { app } = store.getState();
        if (!app.loading && app.user && app.synced) {
          this.setState({
            loading: false
          });
        }
        else if (!this.state.loading) {
          this.setState({
            loading: true
          });
        }
      });
    }
  }

  componentWillReceiveProps (nextProps: Props) {
    this.handleStore(nextProps);
  }

  componentDidMount () {
    this.handleStore();
  }

  render () {
    const {store} = this.props;
    return <div>
      <TitleBar dark={!this.state.loading} origin={origin} />
      <CompactdApplication store={store} origin={origin.toString()}/>
    </div>
  }
}