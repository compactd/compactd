import { Component } from '@nestjs/common';

import Debug from 'debug';

import * as os from 'os';
import * as path from 'path';

const debug = Debug('compactd:config');

@Component()
export default class ConfigService {
  public getDatabaseUsername() {
    return 'admin';
  }
  public getDatabasePassword() {
    return 'password';
  }
  public getDatabaseCredentials() {
    return `${this.getDatabaseUsername()}:${this.getDatabasePassword()}`;
  }
  public async load() {
    return;
  }
  public getDirectory() {
    return path.join(os.homedir(), '.compactd');
  }
  public getJWTSecret() {
    return '2fb2cfa7bac33a8b02a4b0ce8f85c46feb90f4ea20697c52fb84a855baf9202b';
  }
}
