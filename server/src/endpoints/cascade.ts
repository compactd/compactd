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

  app.post('/api/cascade/trackers/:type/:name/password', (req, res) => {
    const {type, name} = req.params;
    const {password} = req.body;
    
    Trackers.setPassword(trackerURI({type, name}), password).then(() => {
      res.status(200).send({ok: true});
    }).catch((err) => {
      res.status(500).send({error: 'An error occured. Please check logs for more details'});
      mainStory.error('cascade', 'An error occured while interacting with db', {
        attach: err
      });
    });
  });

  app.get('/api/cascade/trackers/:type/:tname/search', (req, res) => {
    const {type, tname} = req.params;
    const {name, artist} = req.query;
    Trackers.searchTracker(trackerURI({type, name: tname} as any), {
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
