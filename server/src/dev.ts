require('module-alias/register');

import { NestFactory } from '@nestjs/core';
import express from 'express';
import webpack from 'webpack';
import webpackDevMiddleware from 'webpack-dev-middleware';
import webpackHotMiddleware from 'webpack-hot-middleware';

import AppModule from '@modules/AppModule';
import { join } from 'path';

async function bootstrap() {
  const server = express();
  const compiler = webpack({
    ...require('../../client/webpack.config.js'),
    mode: 'development'
  });
  const devMiddleware = webpackDevMiddleware(compiler);
  server.use(devMiddleware);
  server.use(webpackHotMiddleware(compiler));

  const app = await NestFactory.create(AppModule, server, {});
  app.setGlobalPrefix('api');
  await app.listenAsync(3000);
}
bootstrap();
