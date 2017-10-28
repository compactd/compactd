import * as Express from 'express';
import * as utils from '../features/utils/library-utils';
import {mainStory} from 'storyboard';

export default function(app: Express.Application) {
  app.post('/api/tracks/toggle-hidden', (req, res) => {
    utils.toggleHideTrack(req.body.track).then(() => {
      res.status(200).send({success: true});
    }).catch((err) => {
      res.status(500).send({
        success: false,
        error: 'An error occurred, please see logs for more details'
      });
      mainStory.error('utils', err.message, {attach: err});
    });
  });
}