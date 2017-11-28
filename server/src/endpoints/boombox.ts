import * as Express from 'express';
import * as Direct from '../features/boombox/Direct';
import Encoder, {ENCODER_PRESETS} from '../features/boombox/encoder';
import {mainStory} from 'storyboard';
import {trackURI, File} from 'compactd-models';
import PouchDB from '../database';
import * as mime from 'mime';
import * as fs from 'fs';

Encoder.INSTANCE.on('error', (err: any)=> {
  console.log(err);
  
});
Encoder.INSTANCE.on('start', function(commandLine: any) {
  console.log('Spawned Ffmpeg with command: ' + commandLine);
});

const audioType = require('audio-type');

export default function(app: Express.Application) {
  app.post('/api/boombox/direct', (req, res) => {
    Direct.createSession(req.body.track).then((token) => {
      res.status(201).send({ ok: true, token });
    }).catch((err) => {
      mainStory.error('boombox', err.message, {attach: err});
      res.status(err.status || 500).send({ok: false, error: 'Couldnt create token'});
    });
  });
  app.get('/api/boombox/:artist/:album/:number/:track/:preset', async (req, res) => {
    
    const {artist, album, number, track, preset} = req.params;
    const id = trackURI({artist, album, number, name: track});
    if (!ENCODER_PRESETS[preset]) {
      return res.status(404).send({
        error: 'preset not found'
      });
    }

    const files = new PouchDB<File>('files');
    
    const docs = await files.allDocs({
      include_docs: true,
      startkey: id,
      endkey: id + '\uffff'
    });

    const file = docs.rows[0].doc;

    Encoder.INSTANCE.setEncoderOptions(ENCODER_PRESETS[preset]);
    const buffer = await Encoder.INSTANCE.run(file.path);
    let type = mime.getType(audioType(buffer));

    // Owrkaround
    if (type === 'audio/x-flac') {
      type = 'audio/flac';
    }
    res.setHeader('content-type', type);
    res.setHeader('transfer-encoding', 'chunked');
    res.setHeader('connection', 'chunked');
    res.setHeader('accept-ranges', 'bytes');
    res.setHeader('transfer-encoding', 'chunked');

    const size = buffer.byteLength;

    if (req.headers['range']) {

      const [b, range] = (req.headers['range'] as string).split('=');
      
      if (b === 'bytes') {
        let [start, end] = range.split('-').map(i => +i);

        if (!end || end < start)
          end = size - 1;

        const opts = {
          start: start - 0,
          end: end - 0
        };
        res.status(206)
        res.setHeader('Content-Range', `bytes ${start}-${end}/${size}`);
        res.setHeader('Content-Length', end - start + 1);
        res.send(buffer.slice(start, end));
        return;
      }
    }

    res.send(buffer);
  });
}

export function player (app: Express.Application) {
  app.get('/api/boombox/stream/:token', (req, res) => {
    res.sendFile(Direct.readToken(req.params.token), {
      maxAge: '1d'
    });
  })
}