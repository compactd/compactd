import { createRouteParamDecorator } from '@nestjs/common';
import { IBaseUser } from '@services/AuthService';

export const User = createRouteParamDecorator((data, req) => {
  return req.user as IBaseUser;
});

export type IUser = IBaseUser;
