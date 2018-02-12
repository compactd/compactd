import * as Express from 'express';
import scanner from './scanner';
import aquarelle from './aquarelle';
import boombox from './boombox';
import assets from './assets';
import datasource from './datasource';
import cascade from './cascade';
import analytics from './analytics';
import utils from './utils';
import waveform from './waveform';

export default function (app: Express.Application) {
  scanner(app);
  aquarelle(app);
  assets(app);
  boombox(app);
  cascade(app);
  waveform(app);
  utils(app);
  analytics(app);
  datasource(app);
}