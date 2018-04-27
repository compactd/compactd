import DepToken from '@constants/DepToken';
import AppModule from '@modules/AppModule';
import AuthService from '@services/AuthService';
import ConfigService from '@services/ConfigService';
import TokenService from '@services/TokenService';

import { Test } from '@nestjs/testing';
import express from 'express';
import request from 'supertest';
import MemoryPouchFactory from '../utils/MemoryPouchFactory';

const { version } = require('../../../package.json');

describe('Create token', () => {
  const server = express();

  let authService: AuthService;

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
  });

  it(`Creates a token with correct credentials`, async () => {
    const { body } = await request(server)
      .post('/sessions')
      .send({ username: 'user', password: 'pass' })
      .expect(201);

    expect(body.token).toMatch(/[a-z0-9\.]/i);
  });

  it(`Fails with incorrect username`, async () => {
    const { body } = await request(server)
      .post('/sessions')
      .send({ username: 'foo', password: 'pass' })
      .expect(401);
    expect(body.message).toMatch(/Invalid username or password/);
  });

  it(`Fails with incorrect password`, async () => {
    const { body } = await request(server)
      .post('/sessions')
      .send({ username: 'user', password: 'not_pass' })
      .expect(401);
    expect(body.message).toMatch(/Invalid username or password/);
  });

  it(`Fails without password`, async () => {
    const { body } = await request(server)
      .post('/sessions')
      .send({ username: 'user' })
      .expect(400);
  });

  it(`Fails without username`, async () => {
    const { body } = await request(server)
      .post('/sessions')
      .send({ username: 'user' })
      .expect(400);
  });
});

describe('Use token', () => {
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

  it(`Logins a user`, async () => {
    const { body } = await request(server)
      .get('/status')
      .set('authorization', `Bearer ${token}`)
      .expect(200);

    expect(body.user).toMatchObject({ username: 'user' });
  });

  it(`Returns 400 with invalid token`, async () => {
    const { body } = await request(server)
      .get('/status')
      .set('authorization', `${token}`)
      .expect(400);

    expect(body.user).toBeUndefined();

    await request(server)
      .get('/status')
      .set('authorization', `token`)
      .expect(400);

    await request(server)
      .get('/status')
      .set('authorization', `Bearer ${token} foo`)
      .expect(400);

    await request(server)
      .get('/status')
      .set('authorization', `Foo ${token}`)
      .expect(400);
  });
});
