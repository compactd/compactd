import { Body, Controller, Get, HttpCode, Post } from '@nestjs/common';
import LibraryService from '@services/LibraryService';
import {
  ICreateLibraryPayload,
  IListDirRes,
  IListDirsReq,
  LibraryEndpoint
} from 'shared/definitions/library';

@Controller()
export default class LibraryController {
  constructor(private readonly libraryService: LibraryService) {}
  @Get(LibraryEndpoint.ListLibraries)
  public async getLibraries() {
    return {
      libraries: (await this.libraryService.getLibraries()).map(el =>
        el.getProps()
      )
    };
  }
  @Post(LibraryEndpoint.CreateLibrary)
  public async createLibrary(@Body() payload: ICreateLibraryPayload) {
    return {
      libraries: await this.libraryService.createLibrary(payload)
    };
  }

  @HttpCode(200)
  @Post(LibraryEndpoint.ListDirs)
  public async listDirs(@Body() { path }: IListDirsReq): Promise<IListDirRes> {
    return {
      dirs: await this.libraryService.listDirs(path)
    };
  }
}
