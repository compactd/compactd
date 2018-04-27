import DepToken from 'shared/constants/DepToken';

import AppModule from '@modules/AppModule';
import AuthService from '@services/AuthService';
import ConfigService from '@services/ConfigService';
import TokenService from '@services/TokenService';

import { LibraryEndpoint } from 'shared/definitions/library';

import { Test } from '@nestjs/testing';
import express from 'express';
import { join } from 'path';
import request from 'supertest';
import MemoryPouchFactory from '../utils/MemoryPouchFactory';

const { version } = require('../../../package.json');

describe(LibraryEndpoint.ListDirs, () => {
  const server = express();

  let authService: AuthService;
  let token = '';

  beforeAll(async () => {
    const module = await Test.createTestingModule({
      imports: [AppModule]
    })
      .overrideComponent(DepToken.DatabaseFactory)
      .useFactory(MemoryPouchFactory as any)
      .compile();

    const app = module.createNestApplication(server);
    await app.init();

    authService = new AuthService(
      new TokenService(new ConfigService()),
      MemoryPouchFactory.useFactory()
    );

    await authService.createUser('user', 'pass');

    const { body } = await request(server)
      .post('/sessions')
      .send({ username: 'user', password: 'pass' })
      .expect(201);

    token = body.token;
  });

  it(`Fails without a user`, () => {
    return request(server)
      .post(LibraryEndpoint.ListDirs)
      .send({ path: join(__dirname, '..') })
      .expect(401);
  });

  it(`Return directory list`, async () => {
    const { body } = await request(server)
      .post(LibraryEndpoint.ListDirs)
      .send({ path: join(__dirname, '..') })
      .set('authorization', `Bearer ${token}`)
      .expect(200);

    expect(body).toMatchObject({
      data: {
        dirs: [
          {
            name: 'controllers'
          },
          {
            name: 'integration'
          },
          {
            name: 'services'
          },
          {
            name: 'utils'
          }
        ]
      },
      status: 'success'
    });
  });

  it(`Fails with unsafe root dir`, async () => {
    const { body } = await request(server)
      .post(LibraryEndpoint.ListDirs)
      .send({ path: '/dev/sda1' })
      .set('authorization', `Bearer ${token}`)
      .expect(403);
  });

  it(`Fails with empty path`, async () => {
    const { body } = await request(server)
      .post(LibraryEndpoint.ListDirs)
      .send({ path: '' })
      .set('authorization', `Bearer ${token}`)
      .expect(400);
  });

  it(`Fails with relative path`, async () => {
    const { body } = await request(server)
      .post(LibraryEndpoint.ListDirs)
      .send({ path: 'foo/bar' })
      .set('authorization', `Bearer ${token}`)
      .expect(400);
  });
});
