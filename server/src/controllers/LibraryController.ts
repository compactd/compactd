import { Body, Controller, HttpCode, Post } from '@nestjs/common';
import LibraryService from '@services/LibraryService';
import {
  IListDirRes,
  IListDirsReq,
  LibraryEndpoint
} from 'shared/definitions/library';

@Controller()
export default class LibraryController {
  constructor(private readonly libraryService: LibraryService) {}

  @HttpCode(200)
  @Post(LibraryEndpoint.ListDirs)
  public async listDirs(@Body() { path }: IListDirsReq): Promise<IListDirRes> {
    return {
      data: {
        dirs: await this.libraryService.listDirs(path)
      },
      status: 'success'
    };
  }
}
