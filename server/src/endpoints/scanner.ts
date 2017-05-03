import * as Express from 'express';
import PouchDB from '../database';
import {Scanner} from '../features/scanner/Scanner';

export default function(app: Express.Application) {
  app.post('/api/scans', (req, res) => {
    const id = req.body.libraryId;
    const libraries = new PouchDB('libraries');
    libraries.get(id).then(() => {
      const scanner = new Scanner(id);
      scanner.scan(PouchDB).catch((err) => {
        console.log(err)
      });
      res.status(201).send({
        status: 201,
        response: 'Scan started'
      });
    }).catch((err) => {
      res.status(400).send({
        status: 400,
        response: 'Couldnt start scan'
      });
    })
  });
}