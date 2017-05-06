import * as React from 'react';
import {LibraryActions} from '../../actions.d';

require('./AlbumDetailsView.scss');

interface AlbumDetailsViewProps {
  actions: LibraryActions;
}

export class AlbumDetailsView extends React.Component<AlbumDetailsViewProps, {}>{
  render (): JSX.Element {
    const {actions} = this.props;
    return <div className="album-details-view">
    </div>
  }
}