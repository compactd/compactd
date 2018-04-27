import { Component, Inject, NestMiddleware } from '@nestjs/common';
import credential from 'credential';
import { PouchFactory } from 'slothdb';

import DepToken from '@constants/DepToken';
import {
  INVALID_USERNAME_OR_PASSWORD,
  MISSING_BODY_PARAMETER
} from '@constants/httpErrors';
import TokenAudience from '@constants/TokenAudience';
import User from '@models/User';
import TokenService from '@services/TokenService';
import { atob, btoa } from '@utils/strings';

import Debug from 'debug';

const debug = Debug('compactd:auth');
const pw = credential();

export interface IBaseUser {
  _id;
  username;
}

@Component()
export default class AuthService {
  constructor(
    private readonly tokenService: TokenService,
    @Inject(DepToken.DatabaseFactory)
    private readonly factory: PouchFactory<any>
  ) {}

  public async createUser(username: string, password: string) {
    const res = (await pw.hash(password)) as string | {};
    const hash = atob(typeof res === 'string' ? res : JSON.stringify(res));

    const user = await User.put(this.factory, {
      hash,
      username
    });

    return {
      _id: user._id,
      username
    };
  }

  public async createToken(username: string, password: string) {
    debug('Trying to find user %s', username);

    if (!password || !username) {
      throw MISSING_BODY_PARAMETER;
    }

    const { _id } = User.create(this.factory, { username });

    debug(`Looking for user '%s'`, _id);

    let hash = '';

    try {
      hash = (await User.findById(this.factory, _id)).hash;
    } catch (err) {
      throw INVALID_USERNAME_OR_PASSWORD;
    }

    const res = await pw.verify(btoa(hash), password);

    if (!res) {
      throw INVALID_USERNAME_OR_PASSWORD;
    }

    const user = { _id, username };

    debug('Creating token for %O', user);

    return this.tokenService.sign(
      { user },
      { expires: '14d', audience: TokenAudience.Auth }
    );
  }

  public verifyToken(token: string) {
    return this.tokenService.verify<{ user: IBaseUser }>(
      token,
      TokenAudience.Auth
    );
  }
}
