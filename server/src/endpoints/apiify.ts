import * as Express from 'express';
import { mainStory } from 'storyboard';

export function apiify (feat: string, promise: Promise<any>, res: Express.Response, status = 200) {
  promise.then((data) => {
    return res.status(status).send({ok: true, data});
  }).catch((err) => {
    mainStory.error(feat, 'Error while executing function', {
      attach: err
    });
    return res.status(500).send({ok: false});
  })
}