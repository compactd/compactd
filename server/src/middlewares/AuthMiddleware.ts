import { ExpressMiddleware, Middleware, NestMiddleware } from '@nestjs/common';
import { Request, Response } from 'express';

import AuthService from '@services/AuthService';

@Middleware()
export class AuthMiddleware implements NestMiddleware {
  constructor(private readonly authService: AuthService) {}

  public resolve(): ExpressMiddleware {
    return async (req: Request, res: Response, next) => {
      const authHeader = req.header('authorization');

      if (!authHeader) {
        return res.status(401).send({ error: 'Missing authorization header' });
      }

      const [bearer, token, empty] = authHeader.split(' ');

      if (empty.length !== 0 || bearer !== 'Bearer') {
        return res.status(401).send({ error: 'Invalid authorization header' });
      }

      const user = this.authService.verifyToken(token);

      if (user) {
        return next();
      } else {
        return res
          .status(401)
          .send({ error: 'Invalid or expired authentication token' });
      }
    };
  }
}
