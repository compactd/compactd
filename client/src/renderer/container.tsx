import { Component } from "react";
import {CompactdStore} from '../app/CompactdStore';
import { CompactdApplication } from 'app/CompactdApplication';
import { TitleBar } from 'renderer/TitleBar/TitleBar';
import { CompactdState, Dict } from "definitions";
import { Store } from "redux";
import * as React from "react";
import { Dialog, FormGroup, Button, Classes } from "@blueprintjs/core";
import * as classNames from 'classnames';
import { OriginItem } from "./OriginItem";
import { ipcMain } from "electron";

require('./container.scss');

interface Props {store: Store<CompactdState>}

const defaultOrigin = {'Local Content': 'http://localhost:9000'};

const ORIGINS_KEY = '__origins';

export class ElectronContainer extends Component<Props, {
  loading: boolean,
  opened: boolean,
  origin: string,
  origins: Dict<string>,
  displayCreate: boolean;
  values: {
    name: string, url: string;
  }
}> {
  constructor () {
    super();
    const origins = this.origins;
  
    this.state = {
      loading: true,
      opened: false,
      origin: this.lastUsedOrigin,
      origins: origins,
      displayCreate: false,
      values: {name: '', url: ''}
    };
  }
  private get lastUsedOrigin () {
    const name = localStorage.getItem('__last_used_origin');
    if (!name) {
      return this.origins['Local Content'];
    }
    return this.origins[name];
  }
  private get origins (): Dict<string> {
    const val = localStorage.getItem(ORIGINS_KEY);
    if (!val) {
      return defaultOrigin;
    }
    return JSON.parse(val);
  }
  handleOriginSelect(origin: string): any {
    const origins = this.origins;
    this.setState({origin, opened: false});
    localStorage.setItem('__last_used_origin', Object.keys(origins).find((name) => origins[name] === origin));
  }
  handleOriginClick () {
    this.setState({opened: true});
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
  handleAddServerClick () {
    const {store} = this.props;
    const {origins, opened, displayCreate, values} = this.state;

    const {name, url} = values;

    const savedOrigins = this.origins;
    savedOrigins[name] = url;

    localStorage.setItem(ORIGINS_KEY, JSON.stringify(savedOrigins));

    this.setState({origins: savedOrigins});
  }
  render () {
    const {store} = this.props;
    const {origin, opened, displayCreate, values} = this.state;
    const origins = this.origins;
    const originList = Object.keys(origins).map((name) => {
      return <OriginItem onSelect={(origin) => this.handleOriginSelect(origin)} current={origin} key={name} name={name} url={origins[name]} />
    });
    return <div>
      <Dialog isOpen={opened} className="origins-dialogs">
        <div className="origin-select">
          <div className="select-header">
            Please select a server
          </div>
          {originList}
          <div className="add-item">
            {displayCreate ? 
              <div className="add-form">
                <FormGroup label="Server name" labelFor="name-input">
                  <input className="pt-input" id="name-input" placeholder="Some server" value={values.name}
                    onChange={(evt) => this.setState({values: {name: evt.target.value, url: values.url}})}/>
                </FormGroup>
                <FormGroup label="Server URL" labelFor="url-input">
                  <input className="pt-input"  id="url-input" placeholder="https://compactd.io" value={values.url}
                    onChange={(evt) => this.setState({values: {url: evt.target.value, name: values.name}})}/>
                  </FormGroup>
                <Button text="Add server" onClick={this.handleAddServerClick.bind(this)}/>
                <Button text="Cancel" className={Classes.MINIMAL} onClick={() => this.setState({displayCreate: !displayCreate})}/>
              </div> : <div>
                <span className="pt-icon-plus"></span>
                <span onClick={() => this.setState({displayCreate: !displayCreate})}>Connect to a new server</span> 
              </div>}
          </div>
        </div>
      </Dialog>
      <TitleBar dark={!this.state.loading} origin={new URL(this.state.origin)} onOriginClick={this.handleOriginClick.bind(this)}/>
      <CompactdApplication store={store} origin={this.state.origin}/>
    </div>
  }
}