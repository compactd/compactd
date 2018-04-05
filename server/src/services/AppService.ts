import { Component } from '@nestjs/common';
const { version } = require('../../../package.json');

@Component()
export default class AppService {
  getVersion(): string {
    return version;
  }
}
