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
  app.post('/api/tracks/remove', (req, res) => {
    utils.removeTrack(req.body.track).then(() => {
      res.status(200).send({success: true});
    }).catch((err) => {
      res.status(500).send({
        success: false,
        error: 'An error occurred, please see logs for more details'
      });
      mainStory.error('utils', err.message, {attach: err});
    });
  });
  app.post('/api/tracks/set-artist', (req, res) => {
    utils.changeTrackArtist(req.body.track, req.body.artist).then(() => {
      res.status(200).send({success: true});
    }).catch((err) => {
      res.status(500).send({
        success: false,
        error: 'An error occurred, please see logs for more details'
      });
      mainStory.error('utils', err.message, {attach: err});
    });
  });
  app.post('/api/artists/create', (req, res) => {
    if (!req.body.name || req.body.name.length < 3) {
      return res.status(400).send({
        error: 'Name is either too short or empty'
      });
    }
    return utils.createArtist(req.body.name).then((doc) => {
      res.status(201).send({doc, ok: true});
    }).catch((err) => {
      res.status(500).send({
        success: false,
        error: 'An error occurred, please see logs for more details'
      });
      mainStory.error('utils', err.message, {attach: err});
    })
  });
}