import * as Express from 'express';
import scanner from './scanner';
import aquarelle from './aquarelle';

export default function (app: Express.Application) {
  scanner(app);
  aquarelle(app);
}