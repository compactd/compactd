require('module-alias/register');

import { NestFactory } from '@nestjs/core';

import AppModule from '@modules/AppModule';
import AuthService from '@services/AuthService';
import TokenService from '@services/TokenService';
import TokenAudience from 'shared/constants/TokenAudience';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  return app;
}

if (process.argv.includes('generate-token')) {
  const userArgIndex = process.argv.indexOf('--user');
  const username =
    userArgIndex > 0 ? process.argv[userArgIndex + 1] : 'configurator_agent';

  bootstrap().then(app => {
    const tokenService = app.get(TokenService);

    const token = tokenService.sign(
      { user: { username } },
      { expires: '10m', audience: TokenAudience.Auth }
    );

    // tslint:disable-next-line:no-console
    console.log('\n  Generated token', token);
  });
}
