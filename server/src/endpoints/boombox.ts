import * as Express from 'express';
import * as Direct from '../features/boombox/Direct';
import {mainStory} from 'storyboard';

export default function(app: Express.Application) {
  app.post('/api/boombox/direct', (req, res) => {
    Direct.createSession(req.body.track).then((token) => {
      res.status(201).send({ ok: true, token });
    }).catch((err) => {
      mainStory.error('boombox', err.message, {attach: err});
      res.status(err.status || 500).send({ok: false, error: 'Couldnt create token'});
    });
  });
}

export function player (app: Express.Application) {
  app.get('/api/boombox/stream/:token', (req, res) => {
    res.sendFile(Direct.readToken(req.params.token), {
      maxAge: '1d'
    });
  })
}