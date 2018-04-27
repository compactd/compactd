import { ExpressMiddleware, Middleware, NestMiddleware } from '@nestjs/common';
import { Request, Response } from 'express';

import {
  INVALID_AUTHORIZATION_HEADER,
  INVALID_TOKEN
} from '@constants/httpErrors';
import AuthService from '@services/AuthService';

@Middleware()
export class UserMiddleware implements NestMiddleware {
  constructor(private readonly authService: AuthService) {}

  public resolve(): ExpressMiddleware {
    return (req: Request, res: Response, next) => {
      const authHeader = req.get('authorization');

      if (!authHeader) {
        return next();
      }

      const [bearer, token, empty] = authHeader.split(' ');

      if (empty || bearer !== 'Bearer') {
        throw INVALID_AUTHORIZATION_HEADER;
      }

      const { user } = this.authService.verifyToken(token);

      if (!user) {
        throw INVALID_TOKEN;
      }

      (req as any).user = user;
      return next();
    };
  }
}
