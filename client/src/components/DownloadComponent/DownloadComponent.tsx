import LibraryItemComponent from "components/LibraryItemComponent/LibraryItemComponent";
import * as React from "react";
import { Spinner, Classes } from "@blueprintjs/core";

require('./DownloadComponent.scss');

export class DownloadComponent extends LibraryItemComponent<{name: string, progress: number}, {}> {
  loadImage(id: string, img: HTMLImageElement): void {}
  loadItem(id: string): void {}
  unloadItem(): void {}

  getClassNames(): string[] {
    return ['download-component'];
  }
  renderSubtitle(): string | JSX.Element {
    return 'Downloading';
  }
  renderHeader(): string | JSX.Element {
    return this.props.name;
  }
  renderImage () {
    return <div className="placeholder-image">
      <Spinner className={Classes.SMALL} value={this.props.progress}/>
    </div>
  }
}