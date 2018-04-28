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
import createTestServer from '../utils/createTestServer';
import createTestUser from '../utils/createTestUser';
import MemoryPouchFactory from '../utils/MemoryPouchFactory';

const { version } = require('../../../package.json');

describe('POST ' + LibraryEndpoint.ListDirs, () => {
  const server = express();
  let token = '';

  beforeAll(async () => {
    await createTestServer(server);
    token = await createTestUser(server);
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
      .set('authorization', `${token}`)
      .expect(200);

    expect(body).toMatchObject({
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
    });
  });

  it(`Fails with unsafe root dir`, async () => {
    const { body } = await request(server)
      .post(LibraryEndpoint.ListDirs)
      .send({ path: '/dev/sda1' })
      .set('authorization', `${token}`)
      .expect(403);
  });

  it(`Fails with empty path`, async () => {
    const { body } = await request(server)
      .post(LibraryEndpoint.ListDirs)
      .send({ path: '' })
      .set('authorization', `${token}`)
      .expect(400);
  });

  it(`Fails with relative path`, async () => {
    const { body } = await request(server)
      .post(LibraryEndpoint.ListDirs)
      .send({ path: 'foo/bar' })
      .set('authorization', `${token}`)
      .expect(400);
  });
});

describe('Library create/list', () => {
  const server = express();
  let token = '';

  beforeAll(async () => {
    await createTestServer(server);
    token = await createTestUser(server);
  });

  test('Creates a library', async () => {
    const { body } = await request(server)
      .post(LibraryEndpoint.CreateLibrary)
      .set('authorization', token)
      .send({ name: 'Foo bar', path: '/foo/bar' })
      .expect(201);

    expect(body).toMatchObject({
      libraries: { _id: 'libraries/foo-bar', name: 'Foo bar', path: '/foo/bar' }
    });
  });

  test('List a library', async () => {
    const { body } = await request(server)
      .get(LibraryEndpoint.CreateLibrary)
      .set('authorization', token)
      .expect(200);

    expect(body).toMatchObject({
      libraries: [
        { _id: 'libraries/foo-bar', name: 'Foo bar', path: '/foo/bar' }
      ]
    });
  });

  test('Fails to create unsafe library', async () => {
    await request(server)
      .post(LibraryEndpoint.CreateLibrary)
      .set('authorization', token)
      .send({ name: 'Foo bar', path: '/var/www' })
      .expect(403);
  });
});
