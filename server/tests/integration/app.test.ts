import express from 'express';
import request from 'supertest';
import { Test } from '@nestjs/testing';
import AppModule from '@modules/AppModule';
import AppService from '@services/AppService';

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
      .get('/api/status')
      .expect(200)
      .expect({
        version
      });
  });
});
