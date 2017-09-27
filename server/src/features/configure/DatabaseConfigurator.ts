import fetch, {Response} from 'node-fetch';
import * as assert from 'assert';
import {Message} from './Configure.d';
import {ChildProcess, fork} from 'child_process';
import {dbs} from './dbs';
import {createValidator} from '../validators';
import {baseConfig} from './baseConfig';
import PouchDB from '../../database';
import * as Analytics from '../analytics/Analytics';
import * as path from 'path';

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
    await this.createConfig();
    await this.setupNode();
    await Analytics.initialize();
    return;
  }

  createConfig (): Promise<any> {
    const db = new PouchDB('config');

    return Promise.all(baseConfig.map((({key, value}) => {
      return db.put({
        _id: key, value
      } as any);
    })));
  }

  configureDatabases (): Promise<any>{
    return Promise.all(dbs.map(({name, schema, perms}) => {
      const db = new PouchDB(name);

      return db.put({
        _id: `_design/validator`,
        validate_doc_update: createValidator(schema, perms)
      } as any);
    })).then(() => {});
  }

  async setupNode () {
    const res: any = await fetch(`http://${
        this.opts.couchHost
      }:${this.opts.couchPort}/_cluster_setup`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: 'Basic ' + new Buffer(
            this.opts.adminUsername + ':' + this.opts.adminPassword).toString('base64')
        },
        body: JSON.stringify({
          action: "enable_cluster",
          username: this.opts.adminUsername,
          password: this.opts.adminPassword,
          bind_address: "0.0.0.0",
          port: 5984})
      }).then((res) => res.json());

    const fres: any = await fetch(`http://${
        this.opts.couchHost
      }:${this.opts.couchPort}/_cluster_setup`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Basic ' + new Buffer(
          this.opts.adminUsername + ':' + this.opts.adminPassword).toString('base64')
      },
      body: JSON.stringify({
        action: "finish_cluster"
      })
    }).then((res) => res.json());
  }

  async endAdminParty () {
    const node = await this.getNode();
    const res: any = await fetch(`http://${
        this.opts.couchHost
      }:${this.opts.couchPort}/_node/${
        node}/_config/admins/${this.opts.adminUsername}`, {
        method: 'PUT',
        body: `"${this.opts.adminPassword}"`
      }).then((res) => res.json());
  }
  getNode (): Promise<string> {
    return fetch(`http://${
      this.opts.couchHost
    }:${this.opts.couchPort}/_membership`)
    .then((response: Response) => {
      return response.json();
    }).then((res: any) => {
      assert.equal(res.all_nodes.length, 1);
      return res.all_nodes[0];
    });
  }
}
