import * as jwt from 'jsonwebtoken';
import * as assert from 'assert';
import config from './config'; 

export default {
  sign: function (content: any, options?: jwt.SignOptions) {
    return jwt.sign(content, config.get('secret'), options);
  },
  verify: function (token: string, options?: jwt.VerifyOptions) {
    return jwt.verify(token, config.get('secret'), options);
  }
}