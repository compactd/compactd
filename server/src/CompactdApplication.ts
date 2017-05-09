import * as express from 'express';
import * as bodyParser from 'body-parser';
import * as morgan from 'morgan';
import * as path from 'path';
import * as PouchDB from 'pouchdb';
import * as shortid from 'shortid';
import {player} from './endpoints/boombox';
import Authenticator from './features/authenticator';
import endpoints from './endpoints';
import config from './config';

const expressProxy: any = require('express-http-proxy');
const expressPouchDB: any = require('express-pouchdb');

export class CompactdApplication {
  private auth: Authenticator;
  protected app: express.Application;
  private port: number;
  private host: string;

  constructor(host: string = 'localhost', port: number = 9000) {
    this.app = express();
    this.port = port;
    this.auth = new Authenticator(shortid.generate(), config.get('secret'));
    this.host = host;
  }

  protected setupCouchDB () {
    this.app.use('/database', expressProxy(
      config.get('couchHost') + ':' + config.get('couchPort'), {
      proxyReqOptDecorator: this.auth.proxyRequestDecorator()
    }));

  }
  public start () {
    return new Promise<undefined>((resolve, reject) => {
      this.setupCouchDB();
      this.configure();
      this.route();
      this.app.listen(this.port, this.host, () => {
        console.log(`  Express listening on ${this.host}:${this.port} `);
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
    this.app.use(morgan(
      ':method :url :status :res[content-length] - :response-time ms'
    ));
    this.app.use(bodyParser.urlencoded({extended: true}));
    this.app.use(bodyParser.json());
    this.app.post('/api/sessions', this.auth.signinUser());
    this.app.post('/api/users', this.auth.signupUser());

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
