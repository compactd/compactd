import * as Express from 'express';
import {MediaSource} from '../features/datasource';
import {mainStory} from 'storyboard';
import config from '../config';

export default function(app: Express.Application) {
  const source  = new MediaSource(config.get('datasourceKey'));
  
  app.get('/api/datasource/search', (req, res) => {
    const {query, type} = req.query;
    
    source.search(query, type).then((results) => {
      const reduced = results.reduce((acc: {[t: string]: any[]}, val) => {
        return Object.assign({}, acc, {
          [val.type]: (acc[val.type] || []).concat(val)
        });
      }, {});

      res.status(200).send(reduced);
    }).catch((err) => {
      mainStory.error('datasource', 'An error happened while trying to fetch results', {attach: err});
      res.status(500).send({error: 'An internal error happened. Check logs for more details.'})
    });
  });

  app.get('/api/datasource/artists/:id', (req, res) => {
    const {id} = req.params;

    source.getArtistById(id).then((artist) => {
      res.status(200).send(artist);
    }).catch((err) => {
      mainStory.error('datasource', 'An error happened while trying to fetch artist', {attach: err});
      res.status(500).send({error: 'An internal error happened. Check logs for more details.'})
    })
  });

  app.get('/api/datasource/autocomplete', (req, res) => {
    const {query, type} = req.query;

    source.autocomplete(query, type).then((results) => {
      const reduced = results.reduce((acc: {[type: string]: any[]}, val) => {
        return {
          ...acc,
          [val.type]: (acc[val.type] || []).concat(val)
        }
      }, {});

      res.status(200).send(reduced);
    }).catch((err) => {
      mainStory.error('datasource', 'An error happened while trying to fetch results', {attach: err});
      res.status(500).send({error: 'An internal error happened. Check logs for more details.'})
    });
  });
}
