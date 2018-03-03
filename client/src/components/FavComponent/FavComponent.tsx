import * as React from "react";
import * as classNames from 'classnames';
import './FavComponent.scss'
import LibraryProvider from "app/LibraryProvider";
import session from "app/session";
import Map from 'models/Map';
import toaster from "app/toaster";
import { Track } from "definitions";
import { Databases } from "definitions/state";


interface FavComponentProps {
  id: string;
  onClick?: Function;
  databases: Databases;
}

export default class FavComponent extends React.Component<FavComponentProps, {
  hovering?: boolean;
  liked: Map<boolean>;
}> {
  private feed: any;
  constructor() {
    super();
    this.state = {
      liked: {},
      hovering: false
    }
  }
  loadTrack (arg: string | FavComponentProps) {
    if (typeof arg === 'object') {
      const {id} = (arg as FavComponentProps);
      if (!id || id === this.props.id) {
        return;
      }
      this.loadTrack(id);

      return;
    }
    if (!arg) {
      return;
    }
    if (this.feed) {
      LibraryProvider.getInstance().cancelFeeds([this.feed]);
    }
    this.feed = LibraryProvider.getInstance().liveFeed(this.props.databases.tracks, arg, (doc: Track) => {
      this.setState({
        liked: {
          ...this.state.liked,
          [arg]: doc.fav
        }
      });
    });
  }

  componentDidMount () {
    this.loadTrack(this.props.id);
  }

  componentWillReceiveProps(nextProps: FavComponentProps) {
    this.loadTrack(nextProps);
  }

  componentWillUnmount () {
    if (this.feed)
      LibraryProvider.getInstance().cancelFeeds([this.feed]);
  }

  render () {
    return <div className={classNames("fav-component", {
      checked: this.props.id && this.state.liked[this.props.id]
    })} onMouseOver={() => {
      this.setState({hovering: true});
    }} onMouseOut={() => {
      this.setState({hovering: false});
    }}  onClick={async (evt) => {
      evt.preventDefault();
      evt.stopPropagation();
      if (this.props.onClick) {
        this.props.onClick();
      }
      const val = !this.state.liked[this.props.id];
      this.setState({
        liked: {
          ...this.state.liked,
          [this.props.id]: val
        }
      });
      const res = await session.fetch(this.props.databases.origin, '/api/tracks/toggle-fav', {
        method: 'POST',
        body: JSON.stringify({track: this.props.id}),
        headers: {
          'content-type': 'application/json'
        }
      });
      const {success} = await res.json();
      if (!success) {
        this.setState({
          liked: {
            ...this.state.liked,
            [this.props.id]: !val
          }
        });
        return toaster.error('Unable to fav, please check logs');
      }


    }}>
      {
        this.state.liked[this.props.id] ?
          this.state.hovering ? <span className="pt-icon-heart-broken"></span> : <span className="pt-icon-heart"></span>
         : <span className="pt-icon-heart"></span>
      }

    </div>
  }
}