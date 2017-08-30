import * as React from 'react';
import {StoreActions} from '../../actions.d';

require('./ArtistResult.scss');

interface ArtistResultProps {
  actions: StoreActions;
}

export class ArtistResult extends React.Component<ArtistResultProps, {}>{
  render (): JSX.Element {
    const {actions} = this.props;
    return <div className="artist-result">
    </div>
  }
}