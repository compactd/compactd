import LibraryItemComponent from "components/LibraryItemComponent";
import * as React from "react";
import { Spinner, Classes } from "@blueprintjs/core";

require('./PlaceholderComponent.scss');

export default class PlaceholderComponent extends LibraryItemComponent<{
  loading: boolean
}, {}> {
  loadImage(id: string, img: HTMLImageElement): void {}

  loadItem(id: string): void {}

  unloadItem(): void {}

  getClassNames(): string[] {
    return ['placeholder-component'];
  }
  renderSubtitle(): string | JSX.Element {
    return 'Click to search for albums';
  }
  renderHeader(): string | JSX.Element {
    return 'Add album';
  }
  renderImage() {
    return <div className="placeholder-image">
      {this.props.loading ? <Spinner className={Classes.SMALL}/> : <span className="pt-icon-plus"></span>}
    </div>
  }

}