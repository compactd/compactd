import fetch, {Response} from 'node-fetch';
import * as assert from 'assert';
import {Message} from './Configure.d';
import {ChildProcess, fork} from 'child_process';
import {dbs} from './dbs';
import {createValidator} from '../validators';
import {baseConfig} from './baseConfig';
import PouchDB from '../../database';
import * as Analytics from '../analytics/Analytics';
import {createViews} from '../utils/library-utils';
import * as path from 'path';
import config from '../../config';
import {mainStory} from 'storyboard';

export interface ISDAOptions {
  adminPassword: string;
  adminUsername: string;
  couchPort: number;
  couchHost: string;
}

export class DatabaseConfigurator {
  private url: string;
  private opts: ISDAOptions;

  constructor (opts: ISDAOptions) {
    this.opts = opts;
  }

  async configure () {
    // await this.startServer();
    await this.endAdminParty();
    await this.configureDatabases();
    await this.setupNode();
    await Analytics.initialize();
    await createViews();
    return;
  }

  configureDatabases (): Promise<any>{
    // return Promise.all(dbs.map(({name, schema, perms}) => {
    //   const db = new PouchDB(name);
    //   mainStory.info('configure', )
    //   return db.put({
    //     _id: `_design/validator`,
    //     validate_doc_update: createValidator(schema, perms)
    //   } as any);
    // })).then(() => {});
    return Promise.resolve({});
  }

  async setupNode () {
    mainStory.info('configure', `Trying to setup node...`);

    const url = `http://${
      this.opts.couchHost
    }:${this.opts.couchPort}/_cluster_setup`;

    const body = {
      action: "enable_single_node",
      username: this.opts.adminUsername,
      password: this.opts.adminPassword,
      bind_address: "0.0.0.0",
      singlenode: true,
      port: config.get('couchPort')
    };

    mainStory.info('configure', `POST ${url}`, {
      attach: {...body, password: '<written out>'},
      attachLevel: 'debug'
    });

    const res: any = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Basic ' + new Buffer(
            this.opts.adminUsername + ':' + this.opts.adminPassword).toString('base64')
        },
        body: JSON.stringify(body)
      }).then((res) => res.json());

    mainStory.info('configure', 'CouchDB responded with', {attach: res});
  }

  async endAdminParty () {
    const node = await this.getNode();

    mainStory.info('configure', 'Ending admin party...');

    const url = `http://${
      this.opts.couchHost
    }:${this.opts.couchPort}/_node/${
      node
    }/_config/admins/${this.opts.adminUsername}`;

    mainStory.info('configure', 'PUT ' + url);

    const res: any = await fetch(url, {
        method: 'PUT',
        body: `"${this.opts.adminPassword}"`
      }).then((res) => res.json());

    mainStory.info('configure', 'CouchDB responded with', {attach: res});
  }
  getNode (): Promise<string> {
    mainStory.info('configure', 'Get node name...');
    const url = `http://${
      this.opts.couchHost
    }:${this.opts.couchPort}/_membership`
    mainStory.info('configure', 'GET '+ url)
    return fetch(url)
    .then((response: Response) => {
      return response.json();
    }).then((res: any) => {
      mainStory.info('configure', 'CouchDB responded with', {attach: res});
      assert.equal(res.all_nodes.length, 1);
      return res.all_nodes[0];
    });
  }
}
