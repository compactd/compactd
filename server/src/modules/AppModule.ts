import {
  MiddlewaresConsumer,
  Module,
  NestMiddleware,
  NestModule,
  RequestMethod
} from '@nestjs/common';

import DepToken from '@constants/DepToken';
import AppController from '@controllers/AppController';
import AuthController from '@controllers/AuthController';
import PouchDBFactory from '@helpers/PouchDBFactory';
import { UserMiddleware } from '@middlewares/UserMiddleware';
import AppService from '@services/AppService';
import AuthService from '@services/AuthService';
import ConfigService from '@services/ConfigService';
import TokenService from '@services/TokenService';

@Module({
  components: [
    AppService,
    AuthService,
    ConfigService,
    TokenService,
    PouchDBFactory
  ],
  controllers: [AppController, AuthController]
})
export default class AppModule implements NestModule {
  public configure(consumer: MiddlewaresConsumer) {
    return consumer
      .apply(UserMiddleware)
      .forRoutes(AppController, AuthController);
  }
}
