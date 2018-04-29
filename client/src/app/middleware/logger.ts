import { Middleware } from 'redux';

export const logger: Middleware = store => next => action => {
  // tslint:disable-next-line:no-console
  console.log(action);
  return next(action);
};
