import * as React from "react";
const WinTitleBar = require('electron-react-titlebar').TitleBar as any;
const OSXTitlebar = require('react-desktop/src/titleBar/macOs/titleBar').default;
import * as PropTypes from 'prop-types';
import { Icon } from "@blueprintjs/core";
import {remote} from 'electron';
import * as classNames from 'classnames';
require('./TitleBar.scss');

export class TitleBar extends React.Component<{origin: URL, dark: boolean}> {
  renderOriginMenu () {
    return <div className="origin-menu" onClick={() => console.log('origin')}>
    <Icon iconName="chevron-down" />
      {this.props.origin.hostname}
    </div>
  }
  renderWindows () {
    return <WinTitleBar>
    {this.renderOriginMenu()}
    </WinTitleBar>
  }
  renderOSX () {
    return <OSXTitlebar title=" "
        controls
        transparent={true}
        isFullscreen={false}
        onCloseClick={() => remote.getCurrentWindow().close()}
        onMinimizeClick={() => remote.getCurrentWindow().minimize()}
        onMaximizeClick={() => remote.getCurrentWindow().maximize()}
        onResizeClick={() => {
          const window = remote.getCurrentWindow();
          window.setFullScreen(!window.isFullScreen());
        }}>
        {this.renderOriginMenu()}
      </OSXTitlebar>
  }
  _render () {
    const {platform} = process;

    switch  (platform) {
      case 'darwin':
        return this.renderOSX();
      default:
        return this.renderWindows();
    }
  }
  render () {
    return <div className={classNames("title-bar", {dark: this.props.dark})}>
      {this._render()}
    </div>
  }
}