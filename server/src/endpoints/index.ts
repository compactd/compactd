import * as Express from 'express';
import scanner from './scanner';

export default function (app: Express.Application) {
  scanner(app);
}