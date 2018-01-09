import {CompactdApplication} from './CompactdApplication';
import * as path from 'path';
import * as express from 'express';
import {mainStory} from 'storyboard';
import * as fs from 'fs';
import config from './config';
import * as serveStatic from 'serve-static';
import { setupScheduler } from './scheduler';
import { scheduler } from './features/scheduler/Scheduler';

const pkg = require('../../package.json');

export class ProdApplication extends CompactdApplication {
  constructor (host: string, port: number) {
    super(host, port);
  }
  configure () {
    this.app.use(scheduler.middleware());

    super.configure();
    
    const versionFile = path.join(config.get('dataDirectory'), '_version');
    if (!fs.existsSync(versionFile)) {
      mainStory.fatal('compactd', 'Please upgrade your database to the latest version')
      mainStory.info('compactd', 'You may want to use compactd --upgrade');
      process.exit(1);
    }
    const version = fs.readFileSync(versionFile).toString();
    if (version !== pkg.version) {
      mainStory.fatal('compactd', 'Please upgrade your database to the latest version')
      mainStory.info('compactd', 'You may want to use compactd --upgrade');
      process.exit(1);
    }

  }
  route () {
    super.route();

    this.app.use(serveStatic(path.join(__dirname, '../../client/dist'), {
      dotfiles: 'ignore'
    }));

    this.app.get('*', function (req: express.Request, res: express.Response) {
      res.sendFile(path.join(__dirname, '../../client/dist/index.html'));
    });
  }
}
