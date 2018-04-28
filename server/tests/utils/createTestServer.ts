import AppModule from '@modules/AppModule';
import { Test } from '@nestjs/testing';
import DepToken from 'shared/constants/DepToken';
import MemoryPouchFactory from './MemoryPouchFactory';

export default async function createTestServer(server: Express.Application) {
  const module = await Test.createTestingModule({
    imports: [AppModule]
  })
    .overrideComponent(DepToken.DatabaseFactory)
    .useFactory(MemoryPouchFactory as any)
    .compile();

  const app = module.createNestApplication(server);
  await app.init();
}
