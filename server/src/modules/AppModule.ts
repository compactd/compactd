import { Module } from '@nestjs/common';
import AppController from '@controllers/AppController';

@Module({
  controllers: [AppController]
})
export default class AppModule {}
