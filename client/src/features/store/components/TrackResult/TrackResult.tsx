import * as React from 'react';
import {StoreActions} from '../../actions.d';

require('./TrackResult.scss');

interface TrackResultProps {
  actions: StoreActions;
}

export class TrackResult extends React.Component<TrackResultProps, {}>{
  render (): JSX.Element {
    const {actions} = this.props;
    return <div className="track-result">
    </div>
  }
}