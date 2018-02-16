import * as Express from 'express';
import {Library} from 'compactd-models';
import * as shortid from 'shortid';
import { join } from 'path';
import { searchStores, createStore, putOption, downloadResult } from '../features/store/index';
import { apiify } from './apiify';

 
export default function(app: Express.Application) {
  app.post('/api/stores/search', (req, res) => {
    const {artist, album} = req.body;
    apiify('store', searchStores(artist, album), res);
  });

  app.post('/api/stores', (req, res) => {
    const {type, name} = req.body;
    apiify('store', createStore(type, name), res, 201);
  });

  app.put('/api/stores/:type/:name', (req, res) => {
    const {key, value} = req.body;
    const store = join('stores', req.params.type, req.params.name);
    apiify('store', putOption(store, key, value), res);
  });

  app.post('/api/stores/:type/:name', (req, res) => {
    const id = req.body.result;
    const store = join('stores', req.params.type, req.params.name);
    apiify('store', downloadResult(store, id), res, 201);
  });
}