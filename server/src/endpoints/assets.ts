import * as Express from 'express';
import PouchDB from '../database';
import * as fs from 'fs';
import * as path from 'path';

export default function(app: Express.Application) {
  app.get('/api/assets/:asset', (req, res) => {
    const dir = path.join(__dirname, '../../../assets');
    const f = fs.readdirSync(dir).find((dir) => req.params.asset === dir);
    if (f) {
      return res.sendFile(path.join(dir, f), {
        maxAge: '4h'
      });
    }
  });
}