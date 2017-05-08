import * as Express from 'express';
import * as Agent from '../features/aquarelle/AquarelleAgent';
import * as fs from 'fs';
import * as sharp from 'sharp';
import {artistURI, albumURI} from 'compactd-models';

const trickle = require('timetrickle');

export default function(app: Express.Application) {

  const limit = trickle(5, 2500);

  app.post('/api/aquarelle', (req, res) => {
    Agent.processAlbums().catch((err) => {
      console.log(err);
    });
    Agent.processArtists().catch((err) => {
      console.log(err);
    });
    res.status(201).send({ok: true});
  });
  app.get('/api/aquarelle/:artist', (req, res) => {
    limit(() => {
      const {artist} = req.params;
      const file = Agent.getCacheEntry(artistURI({name: artist}));
      
      if (!fs.existsSync(file) || fs.lstatSync(file).size < 10) 
        return res.status(404).send({error: 'File not found'});''

      res.contentType('image/png');
      res.setHeader('Cache-Control', 'max-age=900');

      if (req.query.s) {
        const s = +req.query.s;
        if (!isNaN(s)) {
          return sharp(file).resize(s, s).toBuffer().then((buffer) => {
            res.send(buffer);
          });
        }
      }

      res.writeHead(200, {});
      fs.createReadStream(file).pipe(res);
    });
  });

  app.get('/api/aquarelle/:artist/:album', (req, res) => {
    limit(() => {

      const {artist, album} = req.params;
      const file = Agent.getCacheEntry(albumURI({name: album, artist}));
      
      if (!fs.existsSync(file) || fs.lstatSync(file).size < 10) 
        return res.status(404).send({error: 'File not found'});

      res.contentType('image/png');
      res.setHeader('Cache-Control', 'max-age=900');

      if (req.query.s) {
        const s = +req.query.s;
        if (!isNaN(s)) {
          return sharp(file).resize(s, s).toBuffer().then((buffer) => {
            res.send(buffer);
          });
        }
      }

      res.writeHead(200, {});
      fs.createReadStream(file).pipe(res);
    });
    })
}