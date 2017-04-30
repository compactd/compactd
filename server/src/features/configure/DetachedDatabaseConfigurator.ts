import fetch, {Response} from 'node-fetch';
import * as assert from 'assert';
import {Message} from './Configure.d';
import {ChildProcess, fork} from 'child_process';
import * as path from 'path';

const randomPort: any = require('random-port');

export interface ISDAOptions {
  adminPassword: string;
  adminUsername: string;
}

export class DetachedDatabaseConfigurator {
  private url: string;
  private opts: ISDAOptions;
  constructor (opts: ISDAOptions) {
    this.opts = opts;
  }
  /**
   * Start StandaloneDatabaseApplication as a child process
   * Resolve when server is up with [port, process]
   */
  startServer () {
    return new Promise<[number, ChildProcess]>((resolve, reject) => {
      randomPort((port: number) => {
        this.url = `localhost:${port}`;
        const proc = fork(path.join(__dirname, './Bootstrap.js'));
        proc.on('message', function (message: Message) {
          if (message.type === 'SERVER_STARTED') {
            resolve([port, proc]);
          }
        });
        proc.send({
          type: 'START_SERVER',
          data: {
            port, host: 'localhost'
          }
        } as Message);
      });
    });
  }
  async configure () {
    await this.startServer();
    await this.endAdminParty();
    return;
  }
  async endAdminParty () {
    const node = await this.getNode();
    const res: any = await fetch(
      `http://${this.url}/database/_node/${node}/_config/admins/${this.opts.adminUsername}`, {
        method: 'PUT',
        body: `"${this.opts.adminPassword}"`
      }).then((res) => res.json());
  }
  getNode (): Promise<string> {
    return fetch(`http://${this.url}/database/_membership`).then((response: Response) => {
      return response.json();
    }).then((res: any) => {
      assert.equal(res.all_nodes.length, 1);
      return res.all_nodes[0];
    });
  }
}
