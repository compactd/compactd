import {
  Body,
  Controller,
  Get,
  HttpCode,
  Param,
  Post,
  Query
} from '@nestjs/common';
import LibraryService from '@services/LibraryService';
import {
  ICreateLibraryPayload,
  ILibraryScansParams,
  ILibraryScansQuery,
  IListDirRes,
  IListDirsReq,
  LibraryEndpoint
} from 'shared/definitions/library';

@Controller()
export default class LibraryController {
  constructor(private readonly libraryService: LibraryService) {}

  @Get(LibraryEndpoint.Libraries)
  public async getLibraries() {
    return {
      libraries: (await this.libraryService.getLibraries()).map(el =>
        el.getProps()
      )
    };
  }

  @Post(LibraryEndpoint.Libraries)
  public async createLibrary(@Body() payload: ICreateLibraryPayload) {
    return {
      library: await this.libraryService.createLibrary(payload)
    };
  }

  @Post(LibraryEndpoint.LibraryScans)
  public async scanLibrary(@Param() { id }) {
    return {
      job: await this.libraryService.scanLibrary(id)
    };
  }

  @Get(LibraryEndpoint.LibraryScans)
  public async getLibraryScans(
    @Param() { id }: ILibraryScansParams,
    @Query() { status }: ILibraryScansQuery
  ) {
    return {
      jobs: await this.libraryService.getScans({ id }, { status })
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
