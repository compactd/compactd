import * as Express from 'express';
import Waveform from '../features/waveform/Waveform';
import {trackURI} from 'compactd-models';
import {mainStory} from 'storyboard';

export default function(app: Express.Application) {
  app.get('/api/tracks/:artist/:album/:number/:name/waveform', (req, res) => {
    const uri = trackURI(req.params)
    Waveform.getData(uri).then((data: any) => {
      res.status(200).send(data);
    }).catch((err: Error) => {
      res.status(500).send({
        success: false,
        error: 'An error occurred, please see logs for more details'
      });
      mainStory.error('waveform', err.message, {attach: err});
    });
  });
}