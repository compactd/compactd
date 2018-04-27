import { HttpException } from '@nestjs/common';

import createError from 'http-errors';

export const INVALID_USERNAME_OR_PASSWORD = new HttpException(
  'Invalid username or password',
  401
);
export const MISSING_BODY_PARAMETER = new HttpException(
  'A required body parameter is missing',
  400
);
export const INVALID_AUTHORIZATION_HEADER = new HttpException(
  'Invalid Authorization header',
  400
);
export const INVALID_TOKEN = new HttpException('Invalid or expired token', 400);
