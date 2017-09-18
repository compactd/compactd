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
    // this.app.use('/database', expressProxy(
    //   config.get('couchHost') + ':' + config.get('couchPort'), {
    //   proxyReqOptDecorator: this.auth.proxyRequestDecorator()
    // }));
    this.app.all('/database/:db/*', function(req, res) {
      req.pause();
      
      const headers = this.auth.proxyRequestDecorator()({headers: {...req.headers}}, req);
      
      const remoteUrl = req.path.slice(9);
        
      const remoteReq = request({
        method: req.method,
        hostname: config.get('couchHost') + ':' + config.get('couchPort'),
        path: remoteUrl,
        headers: headers
      }, function(remoteRes: request.Response) {
        // node's HTTP parser has already parsed any chunked encoding
        delete remoteRes.headers['transfer-encoding'];
        
        remoteRes.headers['content-type'] ? null : (remoteRes.headers['content-type'] = 'application/json');    
        // CouchDB replication fails unless we use a properly-cased header
        remoteRes.headers['Content-Type'] = remoteRes.headers['content-type'];
        delete remoteRes.headers['content-type'];
        
        res.writeHead(remoteRes.statusCode, remoteRes.headers);
        remoteRes.pipe(res);
      });
      
      remoteReq.on('error', function(err: request.err) {
        res.json(503, {error: 'db_unavailable', reason: err.syscall + ' ' + err.errno});
      });
      
      req.setEncoding('utf8');
      req.resume();
      req.pipe(remoteReq);
    });
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
