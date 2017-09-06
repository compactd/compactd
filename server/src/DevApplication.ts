import {CompactdApplication} from './CompactdApplication';
import * as webpack from 'webpack';
import * as path from 'path';
import * as express from 'express';
import * as webpackDevMiddleware from 'webpack-dev-middleware';
import {mainStory} from 'storyboard';

const conf = path.join(__dirname, '../../config/webpack.development');
const config = require(conf);

export class DevApplication extends CompactdApplication {
  compiler: webpack.Compiler;
  constructor (host: string, port: number) {
    super(host, port);
    
    this.compiler = (~process.argv.indexOf('--no-webpack')
      || process.env.NO_WEBPACK) ? undefined : webpack(config);
  }
  configure () {
    super.configure();
    if (this.compiler) {
      this.app.use(webpackDevMiddleware(this.compiler, {
        noInfo: true,
        publicPath: '/',
        stats: {
          colors: true
        },
        log: (data) => {
          mainStory.info('webpack', data);
        }
      }));
      this.app.use((require("webpack-hot-middleware"))(this.compiler, {
        log: mainStory.info.bind(mainStory.info.prototype, 'hmr')
      }));
    }
  }
  route () {
    super.route();

    this.app.all('/api/*', function (req, res) {
      res.status(404).send({error: 'This is not the endpoint you are looking for'});
    });

    this.app.get('*', function (req: express.Request, res: express.Response) {
      res.sendFile(path.join(__dirname, '../../client/index.html'));
    });
  }

}
