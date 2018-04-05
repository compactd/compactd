import { Component } from '@nestjs/common';
const { version } = require('../../../package.json');

@Component()
export default class AppService {
  public getVersion(): string {
    return version;
  }
}
