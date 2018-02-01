import * as Analytics from '../features/analytics/Analytics';
import * as Express from 'express';
import {trackURI} from 'compactd-models';
import {mainStory} from 'storyboard';

export default (app: Express.Application) => {
  app.post('/api/reports/library/:artist/:album/:number/:track/:type', (req, res) => {
    const {artist, album, track, type, number} = req.params;
    const id = trackURI({artist, album, number, name: track});
    mainStory.debug('analytics', `Reported ${type} for ${id}`);

    Analytics.report(type, id).then((doc) => {
      res.status(201).send(doc);
    }).catch((err) => {
      res.send({ok: false, error: 'An error has occured while creating a report'});
      mainStory.error('analytics', 'An error occured', {attach: err});
    });
  });
  app.get('/api/reports/tracks/top', (req, res) => {
    Analytics.getTopTracks(req.query.limit).then((docs) => {
      res.status(200).send(docs);
    }).catch((err) => {
      res.send({error: 'An error has occured while reducing reports'});
      mainStory.error('analytics', 'An error occured', {attach: err});
    })
  });
  app.get('/api/tracks/favorites/top', (req, res) => {
    Analytics.getFavedTracks().then((docs) => {
      res.status(200).send(docs);
    }).catch((err) => {
      res.send({error: 'An error has occured while reducing reports'});
      mainStory.error('analytics', 'An error occured', {attach: err});
    })
  });
}