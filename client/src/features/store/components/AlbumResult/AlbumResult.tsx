import * as React from 'react';
import {StoreActions} from '../../actions.d';

require('./AlbumResult.scss');

interface AlbumResultProps {
  actions: StoreActions;
}

export class AlbumResult extends React.Component<AlbumResultProps, {}>{
  render (): JSX.Element {
    const {actions} = this.props;
    return <div className="album-result">
    </div>
  }
}