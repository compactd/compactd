import { Component } from '@nestjs/common';
import LibraryService from '@services/LibraryService';
const { version } = require('../../../package.json');

@Component()
export default class AppService {
  constructor(private readonly libraryService: LibraryService) {}

  public async isConfigured() {
    const libs = await this.libraryService.getLibraries();

    return libs.length !== 0;
  }

  public getVersion(): string {
    return version;
  }
}
