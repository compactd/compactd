import { Component, Inject } from '@nestjs/common';

import * as jwt from 'jsonwebtoken';
import * as os from 'os';
import * as path from 'path';

import ConfigService from '@services/ConfigService';
import TokenAudience from 'shared/constants/TokenAudience';

@Component()
export default class TokenService {
  private configService: ConfigService;
  constructor(configService: ConfigService) {
    this.configService = configService;
  }
  public sign<T>(
    payload: T,
    opts: { expires: string; audience: TokenAudience }
  ) {
    return jwt.sign(payload, this.configService.getJWTSecret(), {
      audience: opts.audience,
      expiresIn: opts.expires
    });
  }
  public verify<T = any>(token: string, audience: TokenAudience): T {
    const decoded = jwt.verify(token, this.configService.getJWTSecret(), {
      audience
    });
    if (typeof decoded === 'string') {
      throw new Error('Provided token is a string');
    }
    return (decoded as any) as T;
  }
}
