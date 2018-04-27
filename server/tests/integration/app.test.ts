import AppModule from '@modules/AppModule';
import AppService from '@services/AppService';

import { Test } from '@nestjs/testing';

import express from 'express';
import request from 'supertest';

const { version } = require('../../../package.json');

describe('App', () => {
  const server = express();

  beforeAll(async () => {
    const module = await Test.createTestingModule({
      imports: [AppModule]
    }).compile();

    const app = module.createNestApplication(server);
    await app.init();
  });

  it(`GET /api/status`, () => {
    return request(server)
      .get('/status')
      .expect(200)
      .expect({
        version
      });
  });
});
