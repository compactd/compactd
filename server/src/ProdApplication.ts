import {CompactdApplication} from './CompactdApplication';
import * as path from 'path';
import * as express from 'express';
import {mainStory} from 'storyboard';

export class ProdApplication extends CompactdApplication {
  constructor (host: string, port: number) {
    super(host, port);
    
  }
  configure () {
    super.configure();
  }
  route () {
    super.route();

    this.app.get('/vendor.bundle.js', function (req: express.Request, res: express.Response) {
      res.sendFile(path.join(__dirname, '../../client/dist/vendor.bundle.js'));
    });

    this.app.get('/app.js', function (req: express.Request, res: express.Response) {
      res.sendFile(path.join(__dirname, '../../client/dist/application.js'));
    });
    
    this.app.get('/app.js.map', function (req: express.Request, res: express.Response) {
      res.sendFile(path.join(__dirname, '../../client/dist/application.js.map'));
    });
    
    this.app.all('/api/*', function (req, res) {
      res.status(404).send({error: 'This is not the endpoint you are looking for'});
    });

    this.app.get('*', function (req: express.Request, res: express.Response) {
      res.sendFile(path.join(__dirname, '../../client/index.html'));
    });


  }

}
