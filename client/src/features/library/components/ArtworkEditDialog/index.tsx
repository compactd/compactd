import * as React from 'react';
import { Dialog, FileUpload } from '@blueprintjs/core';
import Session from 'app/session';
import { BetterImage } from 'components';
import Toaster from 'app/toaster';

require('./ArtworkEditDialog.scss');

interface ArtworkEditDialogProps {
  item: string;
  isOpen: boolean;
  onClose: (event?: React.SyntheticEvent<HTMLElement>) => void;
}

export default class ArtworkEditDialog extends React.Component<ArtworkEditDialogProps, {
  data: {
    results: {
      url: string,
      dimensions: [number, number]
    }[]
  }
}> {
  constructor () {
    super();
    this.state = {data: {results: []}};
  }
  componentWillReceiveProps(nextProps: ArtworkEditDialogProps) {
    if (nextProps.isOpen && !this.props.isOpen) {
      Session.fetch('/api/aquarelle/search/' + this.props.item)
        .then((res) => res.json()).then((data) => {
          this.setState({data});
      });
    }
  }
  render () {
    const {item, isOpen, onClose} = this.props;
    const results = this.state.data.results.slice(0, 10).map((res) => {
      return <div className="image-container" key={res.url} onClick={() => {
        onClose();
        Session.fetch(`/api/aquarelle/${item}/remote`, {
          method: 'PUT',
          body: JSON.stringify({
            url: res.url
          }),
          headers: {'Content-Type': 'application/json'}
        });
       
      }}>
        <BetterImage src={res.url} height={128} />
        <div className="image-info">
          {res.dimensions[0]}x{res.dimensions[1]}
        </div>
      </div>;
    });
    return <Dialog isOpen={isOpen} onClose={onClose} title="Change artwork">
      <div className="result-row">
        <div className="header">Google image results</div>
        <div className="content">{results}</div>
      </div>
      <div className="result-row">
        <div className="header">Upload Custom Image</div>
        <div className="content">
         <FileUpload text="Choose file..." onInputChange={(evt) => {
           const [file] = (evt.target as any).files as File[];
           if (file.type !== 'image/jpeg') {
             return Toaster.error('Please select a JPEG image');
           }
           onClose();
           const data = new FormData();
           data.append('file', file);
           Session.fetch(`/api/aquarelle/${item}/upload`, {
             body: data,
             method: 'PUT'
           }).then(() => {
           });
         }} />
        </div>
      </div>
    </Dialog>;
  }
}