import { Component } from '@nestjs/common';
import LibraryService from '@services/LibraryService';
const { version } = require('../../../package.json');

@Component()
export default class AppService {
  constructor(private readonly libraryService: LibraryService) {}

  public isConfigured() {
    return this.libraryService.getLibraries().then(items => items.length !== 0);
  }

  public getVersion(): string {
    return version;
  }
}
