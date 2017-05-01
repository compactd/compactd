import * as express from 'express';
import * as bodyParser from 'body-parser';
import * as morgan from 'morgan';
import * as path from 'path';
import * as PouchDB from 'pouchdb';

const expressPouchDB: any = require('express-pouchdb');

export class CompactdApplication {
  protected app: express.Application;
  private port: number;
  private host: string;

  constructor(host: string = 'localhost', port: number = 9000) {
    this.app = express();
    this.port = port;
    this.host = host;
  }

  protected setupCouchDB () {
    this.app.use('/database', expressPouchDB(PouchDB.defaults({
      prefix: './database/',
    } as any), {
      couchConfig: {
        database_dir: path.join(__dirname, '../../database'),
        view_index_dir: path.join(__dirname, '../../views'),
      }
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
  /**
   * Configure express app by adding middlewares
   */
  configure () {
    this.app.use(morgan(
      ':method :url :status :res[content-length] - :response-time ms'
    ));
    this.app.use(bodyParser.urlencoded({extended: true}));
    this.app.use(bodyParser.json());
  }
  /**
   * Creates the routes
   */
  route () {

  }
}
