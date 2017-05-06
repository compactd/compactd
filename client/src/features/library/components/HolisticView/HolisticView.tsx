import * as React from 'react';
import {LibraryActions} from '../../actions.d';

require('./HolisticView.scss');

interface HolisticViewProps {
  actions: LibraryActions;
}

export class HolisticView extends React.Component<HolisticViewProps, {}>{
  render (): JSX.Element {
    const {actions} = this.props;
    return <div className="holistic-view">
    </div>
  }
}