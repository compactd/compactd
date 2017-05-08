import * as Express from 'express';
import scanner from './scanner';
import aquarelle from './aquarelle';
import assets from './assets';

export default function (app: Express.Application) {
  scanner(app);
  aquarelle(app);
  assets(app);
}