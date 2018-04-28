import {
  MiddlewaresConsumer,
  Module,
  NestMiddleware,
  NestModule,
  OnModuleInit,
  RequestMethod
} from '@nestjs/common';

import DepToken from 'shared/constants/DepToken';

import AppController from '@controllers/AppController';
import AuthController from '@controllers/AuthController';
import LibraryController from '@controllers/LibraryController';
import PouchDBFactory from '@helpers/PouchDBFactory';
import { AuthMiddleware } from '@middlewares/AuthMiddleware';
import { UserMiddleware } from '@middlewares/UserMiddleware';
import AppService from '@services/AppService';
import AuthService from '@services/AuthService';
import ConfigService from '@services/ConfigService';
import JobService from '@services/JobService';
import LibraryService from '@services/LibraryService';
import MediaScannerService from '@services/MediaScannerService';
import TokenService from '@services/TokenService';

@Module({
  components: [
    AppService,
    AuthService,
    ConfigService,
    TokenService,
    LibraryService,
    PouchDBFactory,
    JobService,
    MediaScannerService
  ],
  controllers: [AppController, AuthController, LibraryController]
})
export default class AppModule implements NestModule, OnModuleInit {
  constructor(private readonly jobService: JobService) {}
  public onModuleInit() {
    this.jobService.processQueue();
  }
  public configure(consumer: MiddlewaresConsumer) {
    return consumer
      .apply(UserMiddleware)
      .forRoutes(AppController, AuthController, LibraryController)
      .apply(AuthMiddleware)
      .forRoutes(LibraryController);
  }
}
