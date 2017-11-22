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
      const devMiddleware = webpackDevMiddleware(this.compiler, {
        noInfo: true,
        publicPath: '/',
        stats: {
          colors: true
        },
        log: (data) => {
          mainStory.info('webpack', data);
        }
      });
      this.app.use(devMiddleware);
      this.app.get('*', (req, res, next) => {
        if (!req.url.startsWith('/database') && !req.url.startsWith('/api')) {
          var filename = path.join((this.compiler as any).outputPath, 'index.html');
          //  See https://github.com/jantimon/html-webpack-plugin/issues/145#issuecomment-312911903
          devMiddleware.waitUntilValid(() => {
            this.compiler.outputFileSystem.readFile(filename, (err: any, result: Buffer) => {
              if (err) {
                return next(err);
              }
              res.set('content-type','text/html');
              res.send(result);
              res.end();
            });
          })
          return;
        }
        next();
      });
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
  }

}
