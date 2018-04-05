import { Module } from '@nestjs/common';

import AppController from '@controllers/AppController';
import AppService from '@services/AppService';

@Module({
  components: [AppService],
  controllers: [AppController]
})
export default class AppModule {}
