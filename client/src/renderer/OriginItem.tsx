import * as React from "react";
import session from "app/session";
import * as classNames from 'classnames';

interface OriginItemProps {
  name: string;
  url: string;
  current: string;
  onSelect: (origin: string) => void;
}
type OriginStatus = 'offline' | 'online' | 'connected' | 'expired' | 'errored' | 'unknown';

export class OriginItem extends React.Component<OriginItemProps, {status: OriginStatus}> {
  constructor () {
    super();
    this.state = {status: 'unknown'};
  }
  private fetchStatus () {
    if (this.props.url) {
      session.getStatus(this.props.url).then(({user, versions}) => {
        if (user) {
          return this.setState({status: 'connected'});
        }
        if (versions) {
          return this.setState({status: 'online'});
        }
      }).catch((err) => {
        this.setState({status: 'offline'})
      });
    }
  }

  componentDidMount () {
    this.fetchStatus();
  }

  componentWillReceiveProps(nextProps: OriginItemProps) {
    if (nextProps.url !== this.props.url) {
      this.setState({status: 'unknown'});
      this.fetchStatus();
    }
  }
  
  render () {
    const {name, url, current, onSelect} = this.props;
    const {status} = this.state;

    return <div className="origin-item" onClick={() => {
      onSelect(url)
    }}>
      <div className={classNames("origin-status", status)}>
        <span className="pt-icon-symbol-circle"></span>
      </div>
      <div className="origin-details">
        <div className="origin-header">
          {name}
        </div>
        <div className="origin-sub">
          {new URL(url).hostname}
        </div>
      </div>
    </div>
  }
}