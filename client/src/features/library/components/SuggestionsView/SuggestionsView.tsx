import * as React from 'react';
import {LibraryActions} from '../../actions.d';
import {LibraryState, CompactdState, PlayerState, Track} from 'definitions';
import TrackItem from './TrackItem';
import {Actions} from 'definitions/actions';
import session from 'app/session';

require('./SuggestionsView.scss');

interface SuggestionsViewProps {
  library: LibraryState;
  actions: Actions;
}

export default class SuggestionsView extends React.Component<SuggestionsViewProps, {
  favs: string[]
}>{
  constructor() {
    super();
    this.state = {favs: []};
  }
  componentDidMount () {
    this.props.actions.fetchRecommendations();
    session.fetch(this.props.library.origin, '/api/tracks/favorites/top')
      .then((res) => res.json())
      .then((res) => {
        this.setState({
          favs: res.map((el: any) => el.id)
        });
      });
  }
  render (): JSX.Element {
    const {actions, library} = this.props;
    const items = library.topTracks.slice(0, 10).map((el, index) => {
      return <TrackItem reports={el.value} track={el.key} library={library} actions={actions} key={el.key} index={index} />
    });
    const favs = this.state.favs.slice(0, 10).map((el, index) => {
      return <TrackItem track={el} library={library} actions={actions} key={el} index={index} />
    });
    return <div className="suggestions-view">
      <div className="top-tracks">
        <div className="header"><span className="pt-icon-volume-up"></span>  Most listened tracks</div>
        <div className="content">
          {items}
        </div>
      </div>
      <div className="favs-tracks">
        <div className="header"><span className="pt-icon-heart"></span>  Liked tracks</div>
        <div className="content">
          {favs}
        </div>
      </div>
    </div>
  }
}