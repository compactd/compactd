import {
  MiddlewaresConsumer,
  Module,
  NestMiddleware,
  NestModule,
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
import LibraryService from '@services/LibraryService';
import TokenService from '@services/TokenService';

@Module({
  components: [
    AppService,
    AuthService,
    ConfigService,
    TokenService,
    LibraryService,
    PouchDBFactory
  ],
  controllers: [AppController, AuthController, LibraryController]
})
export default class AppModule implements NestModule {
  public configure(consumer: MiddlewaresConsumer) {
    return consumer
      .apply(UserMiddleware)
      .forRoutes(AppController, AuthController, LibraryController)
      .apply(AuthMiddleware)
      .forRoutes(LibraryController);
  }
}
