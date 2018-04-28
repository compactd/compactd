import AuthService from '@services/AuthService';
import ConfigService from '@services/ConfigService';
import TokenService from '@services/TokenService';
import request from 'supertest';
import MemoryPouchFactory from './MemoryPouchFactory';

export default async function createTestUser(server: Express.Application) {
  const authService = new AuthService(
    new TokenService(new ConfigService()),
    MemoryPouchFactory.useFactory()
  );

  await authService.createUser('user', 'pass');

  const { body } = await request(server)
    .post('/sessions')
    .send({ username: 'user', password: 'pass' })
    .expect(201);

  return `Bearer ${body.token}`;
}
