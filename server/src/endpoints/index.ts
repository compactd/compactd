import * as Express from 'express';
import scanner from './scanner';
import aquarelle from './aquarelle';
import boombox from './boombox';
import assets from './assets';
import datasource from './datasource';

export default function (app: Express.Application) {
  scanner(app);
  aquarelle(app);
  assets(app);
  boombox(app);
  datasource(app);
}