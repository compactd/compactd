import 'storyboard-preset-console';

import * as express from 'express';
import * as bodyParser from 'body-parser';
import * as morgan from 'morgan';
import * as path from 'path';
import * as PouchDB from 'pouchdb';
import * as shortid from 'shortid';
import {player} from './endpoints/boombox';
import Authenticator from './features/authenticator';
import endpoints from './endpoints';
import * as Stream from 'stream';
import config from './config';
import {mainStory} from 'storyboard';
import * as request from 'request';
//import httpEventEmitter from './http-event';
import * as http from 'http';
import { fork } from 'child_process';
import jwt from './jwt';
import httpEvent from './http-event';
const pkg = require('../../package.json');
const socketPouchServer = require('socket-pouch/server');
const modelsPkg = require('../../node_modules/compactd-models/package.json');
// const Ddos = require('ddos');

export class CompactdApplication {
  private static ALLOWED_DATABASES = ['libraries', 'artworks', 'tracks', 'files', 'artists', 'albums', 'trackers', 'stores'];

  private auth: Authenticator;
  protected app: express.Application;
  private port: number;
  private host: string;

  constructor(host: string = config.get('ip'), port: number = config.get('port')) {
    this.app = express();
    this.port = port;
    this.auth = new Authenticator('instance', config.get('secret'));
    this.host = host;
  }

  protected setupCouchDB () {
    // this.app.use('/database', expressProxy(
    //   config.get('couchHost') + ':' + config.get('couchPort'), {
    //   proxyReqOptDecorator: this.auth.proxyRequestDecorator()
    // }));
    this.app.all('/database/*', bodyParser.urlencoded({extended: true}), bodyParser.json(), async (req, res) => {
      // req.pause();
      
      const headers = await this.auth.proxyRequestDecorator()({headers: {...req.headers}}, req);
      const remoteUrl = req.url.slice(10);
      const [db] = remoteUrl.split('/');

      if (!CompactdApplication.ALLOWED_DATABASES.includes(db)) {
        return res.status(403).send({
          error: 'Database ' + db + ' not allowed'
        })
      }
      
      const opts = Object.assign({
        method: req.method,
        url: `http://${config.get('couchHost')}:${config.get('couchPort')}/${remoteUrl}`,
        ...headers,
      }, req.method !== 'GET' ? {body: JSON.stringify(req.body)} : {});

      mainStory.info('http', `${req.method} ${req.url} -> http://${config.get('couchHost')}:${config.get('couchPort')}/${remoteUrl}`);

      const remoteReq = request(opts).pipe(res);
    });

    this.app.get('/api/database/:name', this.auth.requireAuthentication(), (req, res) => {
      const db = req.params.name;
      if (!CompactdApplication.ALLOWED_DATABASES.includes(db)) {
        return res.status(403).send({
          error: 'Database ' + db + ' not allowed'
        });
      }
      return res.status(200).send({ok: true, token: jwt.sign({db, user: (req as any).user}, {
        expiresIn: '1d',
      })});
    });

   fork(path.join(__dirname, 'CouchProxy.js'));

  }
  public start () {
    return new Promise<void>((resolve, reject) => {
      this.setupCouchDB();
      this.configure();
      this.route();
      const server = http.createServer(this.app);
      httpEvent.attach(server as any, this.auth);
      // socketPouchServer.attach(this.app, {
      //   remoteUrl: 'http://localhost:5984',
      //   pouchCreator: () => {
      //     console.log(arguments);
      //   }
      // });
      server.listen(this.port, this.host, () => {
        mainStory.info('http', `Express listening on ${this.host}:${this.port} `);
        resolve();
      });
    });
  }
  protected unprotectedEndpoints () {
    player(this.app);
  }
  /**
   * Configure express app by adding middlewares
   */
  configure () {
    // this.app.use(ddos.express);

    class MorganStream extends Stream.Writable {
      _write(chunk: string, enc: string, next: Function) {
        const str = chunk.toString();
        if (str && str.length) {
          mainStory.info('http', str.replace('\n', ''));
        } 
        next();
      }
    }
    this.app.use(morgan(
      ':method :url :status - :response-time ms', {
        stream: new MorganStream()
      }
    ));
    this.app.use(bodyParser.urlencoded({extended: true}));
    this.app.use(bodyParser.json());
    this.app.post('/api/sessions', this.auth.signinUser());
    this.app.post('/api/users', this.auth.signupUser());
    this.app.get('/api/status', (req, res) => {
      
      const status = {
        versions: {
          server: pkg.version,
          models: modelsPkg.version
        },
        user: undefined as string
      };

      try {
        const [bearer, token] = req.header('Authorization').split(' ');
        const user = this.auth.verifySession(token);
        const unused = user.toLowerCase(); // Check is user isnt undefined, otherwise throw error
        status.user = user;
      } catch (err) {
        status.user = null;
      } finally {
        res.send(status);
      }
    })

    this.unprotectedEndpoints();

    this.app.use('/api*', this.auth.requireAuthentication());
    
  }
  /**
   * Creates the *protected* routes (under api only)
   */
  route () {
    endpoints(this.app);
  }
}
