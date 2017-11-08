import * as Express from 'express';
import * as Agent from '../features/aquarelle/AquarelleAgent';
import * as fs from 'fs';
import * as sharp from 'sharp';
import PouchDB from '../database';
import {artistURI, albumURI} from 'compactd-models';
import {mainStory} from 'storyboard';

const trickle = require('timetrickle');

export default function(app: Express.Application) {

  const limit = trickle(10, 250);

  app.post('/api/aquarelle', (req, res) => {
    Agent.processAlbums().catch((err) => {
      mainStory.error('aquarelle', err.message, {attach: err});
    });
    Agent.processArtists().catch((err) => {
      mainStory.error('aquarelle', err.message, {attach: err});
    });
    res.status(201).send({ok: true});
  });
  app.get('/api/aquarelle/:artist', (req, res) => {
    limit(async () => {
      const {artist} = req.params;
      const size = /^\d+$/.test(req.query.s) ? +req.query.s : 300;
      const arts = new PouchDB('artworks');
      const file = await arts.getAttachment('artworks/library/' + artist,
        size > 64 ? 'large' : 'small') as Buffer;

      res.contentType('image/png');
      res.setHeader('Cache-Control', 'max-age=900');

      if (size !== 300) {
        return sharp(file).resize(size).toBuffer().then((buffer) => {
          res.send(buffer);
        });
      }

      res.writeHead(200, {});
      res.send(file);
    });
  });

  app.get('/api/aquarelle/:artist/:album', (req, res) => {
    limit(async () => {

      const {artist, album} = req.params;
      const size = /^\d+$/.test(req.query.s) ? +req.query.s : 300;
      const arts = new PouchDB('artworks');
      const file = await arts.getAttachment('artworks/library/' + artist + '/' + album,
        size > 64 ? 'large' : 'small') as Buffer;

      res.contentType('image/png');
      res.setHeader('Cache-Control', 'max-age=900');

      if (size !== 300) {
        return sharp(file).resize(size).toBuffer().then((buffer) => {
          res.send(buffer);
        });
      }

      res.writeHead(200, {});
      res.send(file);
    });
  });
}
