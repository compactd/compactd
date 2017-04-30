import {CompactdApplication} from './CompactdApplication';
import * as webpack from 'webpack';
import * as path from 'path';
import * as express from 'express';
import * as webpackDevMiddleware from 'webpack-dev-middleware';

const conf = path.join(__dirname, '../../config/webpack.development');
const config = require(conf);

export class DevApplication extends CompactdApplication {
  compiler: webpack.Compiler;
  constructor (host: string, port: number) {
    super(host, port);
    this.compiler = webpack(config);
  }
  configure () {
    super.configure();
    this.app.use(webpackDevMiddleware(this.compiler, {
      noInfo: true,
      publicPath: '/',
      stats: {
        colors: true
      }
    }));
  }
  route () {
    super.route();
    this.app.get('*', function (req: express.Request, res: express.Response) {
      res.sendFile(path.join(__dirname, '../../client/index.html'));
    });
  }

}
