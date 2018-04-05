import { Module } from '@nestjs/common';
import AppController from '@controllers/AppController';
import AppService from '@services/AppService';

@Module({
  controllers: [AppController],
  components: [AppService]
})
export default class AppModule {}
