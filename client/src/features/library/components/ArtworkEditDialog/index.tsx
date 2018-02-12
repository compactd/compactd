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

const BLANK_IMAGE = 'data:image/png;base64,R0lGODlhFAAUAIAAAP///wAAACH5BAEAAAAALAAAAAAUABQAAAIRhI+py+0Po5y02ouz3rz7rxUAOw==';

export default class ArtworkEditDialog extends React.Component<ArtworkEditDialogProps, {
  data: {
    results: {
      url: string,
      dimensions: [number, number]
    }[]
  },
  itemHeight: number
}> {
  resultsDiv: HTMLDivElement;
  constructor () {
    super();
    this.state = {data: {results: new Array(12)}, itemHeight: 64};
  }
  componentWillReceiveProps(nextProps: ArtworkEditDialogProps) {
    if (nextProps.isOpen && !this.props.isOpen) {
      Session.fetch('/api/aquarelle/search/' + this.props.item)
        .then((res) => res.json()).then((data) => {
          this.setState({data});
      });
    }
  }
  componentDidUpdate () {
    if (!this.resultsDiv) return;
    const {width} = this.resultsDiv.getBoundingClientRect();
    const calculatedWidth = (width / 5) - (5 * 5);
    if (this.state.itemHeight !== calculatedWidth) {
      this.setState({itemHeight: calculatedWidth});
    }
  }
  render () {
    const {item, isOpen, onClose} = this.props;
    const results = this.state.data.results.slice(0, 10).map((res, index) => {
      return <div className="image-container" key={index} onClick={() => {
        onClose();
        Session.fetch(`/api/aquarelle/${item}/remote`, {
          method: 'PUT',
          body: JSON.stringify({
            url: res.url
          }),
          headers: {'Content-Type': 'application/json'}
        });
       
      }} style={{
        height: this.state.itemHeight + 'px',
        width: this.state.itemHeight + 'px',
        background: `url('${res.url || BLANK_IMAGE}') no-repeat center center scroll`,
        backgroundSize: '100% 100%'
      } as any}>
        {/* <div
          height={this.state.itemHeight + 'px'}
          width={this.state.itemHeight + 'px'}
          style={{display: 'block'}} /> */}
        <div className="image-info">
          {res.dimensions[0]}x{res.dimensions[1]}
        </div>
      </div>;
    });
    return <Dialog isOpen={isOpen} onClose={onClose} title="Change artwork">
      <div className="result-row">
        <div className="header">Google image results</div>
        <div className="content" ref={(ref) => this.resultsDiv = ref}>{results}</div>
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