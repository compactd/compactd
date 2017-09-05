import * as Express from 'express';
import * as Trackers from '../features/cascade/trackers';
import Indexer from '../features/cascade';
import {trackerURI} from 'compactd-models';
import {mainStory} from 'storyboard';
import config from '../config';

export default function(app: Express.Application) {
  
  app.get('/api/cascade/trackers', (req, res) => {
    Trackers.listTrackers().then((docs) => {
      res.status(200).send(docs);
    }).catch((err) => {
      res.status(500).send({error: 'An error occured. Please check logs for more details'});
      mainStory.error('cascade', 'An error occured while interacting with db', {
        attach: err
      });
    });
  });

  app.post('/api/cascade/trackers', (req, res) => {
    Trackers.createTracker(req.body.type, req.body.name, req.body.username).then((tracker) => {
      res.status(201).send(tracker);
    }).catch((err) => {
      res.status(500).send({error: 'An error occured. Please check logs for more details'});
      mainStory.error('cascade', 'An error occured while interacting with db', {
        attach: err
      });
    });
  });

  app.post('/api/cascade/trackers/:type/:username/password', (req, res) => {
    const {type, username, password} = req.params;
    Trackers.setPassword(trackerURI({type, username} as any), password).then(() => {
      res.status(200).send({});
    }).catch((err) => {
      res.status(500).send({error: 'An error occured. Please check logs for more details'});
      mainStory.error('cascade', 'An error occured while interacting with db', {
        attach: err
      });
    });
  });

  app.get('/api/cascade/trackers/:type/:username/search', (req, res) => {
    const {type, username} = req.params;
    const {name, artist} = req.query;
    Trackers.searchTracker(trackerURI({type, username} as any), {
      name, artist, type: 'album', id: `${artist}/${name}`
    }).then((docs) => {
      res.status(200).send(docs);
    }).catch((err) => {
      res.status(500).send({error: 'An error occured. Please check logs for more details'});
      mainStory.error('cascade', 'An error occured while searching', {
        attach: err
      });
    })
  });
}
