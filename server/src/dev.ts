require('module-alias/register');

import { NestFactory } from '@nestjs/core';

import AppModule from '@modules/AppModule';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.setGlobalPrefix('api');
  await app.listenAsync(3000);
}
bootstrap();
