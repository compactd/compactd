import * as React from 'react';
import {LibraryActions} from '../../actions.d';
import {LibraryState, CompactdState, PlayerState, Track} from 'definitions';
import TrackItem from './TrackItem';
import {Actions} from 'definitions/actions';

require('./SuggestionsView.scss');

interface SuggestionsViewProps {
  library: LibraryState;
  actions: Actions;
}

export default class SuggestionsView extends React.Component<SuggestionsViewProps, {}>{
  componentDidMount () {
    this.props.actions.fetchRecommendations();
  }
  render (): JSX.Element {
    const {actions, library} = this.props;
    const items = library.topTracks.slice(0, 10).map((el, index) => {
      return <TrackItem reports={el.value} track={el.key} library={library} actions={actions} key={el.key} index={index} />
    });
    return <div className="suggestions-view">
      <div className="top-tracks">
        <div className="header"><span className="pt-icon-volume-up"></span>  Most listened tracks</div>
        <div className="content">
          {items}
        </div>
      </div>
    </div>
  }
}