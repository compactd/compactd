import * as Express from 'express';
import PouchDB from '../database';
import {Scanner} from '../features/scanner/Scanner';
import {mainStory} from 'storyboard';
import {Library} from 'compactd-models';
import httpEventEmitter from '../http-event';
import * as shortid from 'shortid';

export default function(app: Express.Application) {
  app.post('/api/scans', (req, res) => {
    const id = req.body.libraryId;
    
    const libraries = new PouchDB<Library>('libraries');
    libraries.get(id).then(() => {
      const scanner = new Scanner(id);
      const ts = Date.now();

      const scanFinish = `finish_${ts}`;
      const scanError  = `error_${ts}`;
      const openFolder = `open_folder_${ts}`;

      const scanFinishToken = httpEventEmitter.createEventThread(scanFinish);
      const scanErrorToken  = httpEventEmitter.createEventThread(scanError);
      const openFolderToken = httpEventEmitter.createEventThread(openFolder);

      scanner.on('open_folder', (folder) => {
        httpEventEmitter.emit(openFolder, {folder});
      });
      
      scanner.scan(PouchDB).then(() => {
        httpEventEmitter.emit(scanFinish, {ok: true});
      }).catch((err) => {
        mainStory.error('scanner', err.message, {attach: err});
        httpEventEmitter.emit(scanError, {error: err, ok: false});
      });

      res.status(201).send({
        status: 201,
        response: 'Scan started',
        events: {
          finish: scanFinishToken,
          error: scanErrorToken,
          open_folder: openFolderToken
        }
      });
    }).catch((err) => {
      mainStory.error('aquarelle', err.message, {attach: err});
      
      res.status(400).send({
        status: 400,
        response: 'Couldnt start scan'
      });
    })
  });
}