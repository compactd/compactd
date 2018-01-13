import * as Express from 'express';
import * as Agent from '../features/aquarelle/AquarelleAgent';
import * as fs from 'fs';
import * as sharp from 'sharp';
import PouchDB from '../database';
import {artistURI, albumURI, File} from 'compactd-models';
import {mainStory} from 'storyboard';
import { dirname, join } from 'path';
import { findArtworks } from '../features/aquarelle/AquarelleAgent';
import jwt from '../jwt';
import fetch from 'node-fetch';
import { saveArtwork } from '../features/aquarelle/discogfetch';
import * as multer from 'multer';
import config from '../config';

const upload = multer({
  dest: join(config.get('dataDirectory'), 'uploads')
});

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

  app.get('/api/aquarelle/search/library/:artist/:album', async (req, res) => {
    const {artist, album} = req.params;
    const id = albumURI({artist, name: album});

    const albums = new PouchDB('albums');
    const files = new PouchDB<File>('files');
    try {
      const doc = await albums.get(id);
    } catch (err) {
      console.log(err);
      res.status(404).send({error: 'Album not found'});
      return;
    }

    res.status(200).send(await findArtworks(id));
  });

  app.get('/api/aquarelle/search/result/:token', (req, res) => {
    const payload: any = jwt.verify(req.params.token);

    if (payload.source === 'local') {
      return res.status(200).sendFile(payload.file);
    } else if (payload.source === 'remote') {
      return fetch(payload.url).then((res) => {
        return res.buffer();
      }).then((buffer) => {
        res.status(200).send(buffer);
      }).catch((err) => {
        res.send(500);
        console.log(err);
      });
    }
  })

  app.put('/api/aquarelle/library/:artist/:album/remote', (req, res) => {
    const {artist, album} = req.params;
    const id = albumURI({artist, name: album});

    const albums = new PouchDB('albums');
    if  (!req.body.url) {
      return res.status(403).send({error: 'No url'});
    }
    saveArtwork(id, req.body.url).then(() => {
      return res.status(200).send({ok: true});
    }).catch((err) => {
      mainStory.error('aquarelle', 'Error while setting album artwwork from URL '+req.body.url, {
        attach: err
      });
      return res.status(500).send({ok: false});
    })
   
  })
  app.put('/api/aquarelle/library/:artist/:album/upload', upload.single('file'), (req, res) => {
    const {artist, album} = req.params;
    const id = albumURI({artist, name: album});

    const albums = new PouchDB('albums');
    if  (!req.file) {
      return res.status(403).send({error: 'No file provided'});
    }
    saveArtwork(id, req.file.path).then(() => {
      return res.status(200).send({ok: true});
    }).catch((err) => {
      mainStory.error('aquarelle', 'Error while setting album artwwork from URL '+req.body.url, {
        attach: err
      });
      return res.status(500).send({ok: false});
    })
   
  })
}
