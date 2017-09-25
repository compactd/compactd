import PouchDB from '../../database';
import * as password from 'password-hash-and-salt';
import * as Boom from 'boom';
import * as jwt from 'jsonwebtoken';
import fetch from 'node-fetch';
import * as crypto from 'crypto';
import * as qs from 'qs';
import * as assert from 'assert';
import * as Express from 'express';
import {mainStory} from 'storyboard';

const docURI = require('docuri');

const URI = docURI.route('users/:username') as (p: any) => any;

interface UserProps {
  username: string;
  password: string;
  role: string;
}
interface DatabaseUser {
  _id: string;
  type: string;
  roles: string[];
  password: string;
  name: string;
}

// declare namespace Express {
//   interface Request {
//     user?: UserProps;
//     isAuthenticated: () => boolean;
//   }
// }

export default class Authenticator {
  private secret: string;
  private instanceID: string;
  private passwords: {[username: string]: string}

  /**
   * @param instanceID the current process instance ID, generated on start
   * @param secret the JWT secret
   */
  constructor (instanceID: string, secret: string) {
    this.instanceID = instanceID;
    this.secret = secret;
    this.passwords = {};
  }

  /**
   * Hash a password using password-hash-and-salt
   * @param the password to hash
   */
  hashPassword (pass: string) {
    return new Promise((resolve, reject) => {
      password(pass).hash((err, hash) => {
        if (err) return reject(err);
        resolve(hash);
      });
    });
  }

  /**
   * Generate a random password in Base64 using crypto
   * @param length the number of bytes to generate
   */
  generatePassword (length: number = 32): Promise<string> {
    return new Promise((resolve, reject) => {
      crypto.randomBytes(length, (err, data) => {
        if (err) return reject(err);
        resolve(data.toString('hex'));
      });
    })
  }

  /**
   * Verify using password-hash-and-salt the password
   * @param pass the current password to verify
   * @param hash the hash generated by hashPassword()
   */
  verifyPassword (pass: string, hash: string) {
    return new Promise((resolve, reject) => {
      password(pass).verifyAgainst(hash, (err, verified) => {
        if (err) return reject(err);
        resolve(verified);
      });
    });
  }

  /**
   * Create a database _user directly by PUT the CouchDB instance
   * @param user the DatabaseUser to create
   */
  async createDatabaseUser (user: DatabaseUser) {
    const auth = `Basic ${new Buffer(PouchDB.credentials).toString('base64')}`;
    const _users = new PouchDB('_users');
    try {
      const current = await _users.get(user._id);
      await _users.remove(current._id, current._rev);
    } catch (err) {
    }
    const doc = await _users.put(user);
    
  }

  /**
   * Validate the session token and return the username. If it isn't valid, then
   * throw an error...
   * @param token the JWT token to validate
   * @return the username
   */
  verifySession (token: string): string {
    try {
      const session = jwt.verify(token, this.secret, {
        issuer: `compactd#${this.instanceID}`
      });
      if (!session.ok || !session.user) {
        throw new Error('');
      }
      return session.user;
    } catch (err) {
      throw Boom.create(400, 'Invalid or expired token');
    }
  }

  /**
   * Creates a signed session token, create a database user with random password
   * and store the db user password into the password store.
   * @param username the username to create session for
   * @param pass the user password to verify
   * @return the signed token
   */
  async createSession (username: string, pass: string) {
    const appUsers = new PouchDB<UserProps & {_id: string}>('app_users');
    try {
      const user = await appUsers.get(`users/${username}`);
      if (await this.verifyPassword(pass, user.password)) {
        const pwd = await this.generatePassword();
        const dbUser = {
          _id: 'org.couchdb.user:' +  username,
          name: username,
          roles: ['end_user'],
          type: 'user',
          password: pwd
        }
        await this.createDatabaseUser(dbUser);
        this.passwords[username] = pwd;
        setTimeout(() => {
          delete this.passwords[username];
        }, 1000 * 60 * 60 * 24 * 7);

        const token = jwt.sign({user: username, ok: true}, this.secret, {
          expiresIn: '7d',
          issuer: `compactd#${this.instanceID}`
        });
        return token;
      } else {
        throw new Error();
      }
    } catch (err) {
      mainStory.error('authenticator', err.message, {attach: err});
      throw Boom.create(400, 'Invalid credentials');
    }

  }

  /**
   * Create a new `app_user`
   * @param props the user props including username and password
   */
  async registerUser (props: UserProps) {
    await Promise.resolve();

    if (!/^[a-z0-9_]{4,16}$/i.test(props.username)) {
      throw Boom.create(400,
        'Username may only contain between 4 and 16 alphanumeric characters');
    }

    if (!/^.{4,}$/.test(props.password)) {
      throw Boom.create(400,
        'Password needs to be at least 4 characters long');
    }
    try {
      const pass = await this.hashPassword(props.password) as string;

      const appUsers = new PouchDB<UserProps & {_id: string}>('app_users');
      await appUsers.put({
        _id: URI(props) as string,
        username: props.username,
        password: pass as string,
        role: props.role
     });
    } catch (err) {
      mainStory.error('authenticator', err.message, {attach: err});
      throw Boom.create(500, 'Unexpected internal error');
    }
  }

  /**
   * Create a function that will only call next if use token is valid
   */
  requireAuthentication (): Express.RequestHandler {
    return (req, res, next) => {
      if (process.env.WALTZ_AUTH) return next();
      if (!req.header('Authorization')) {
        return res.status(401).send({error: 'You shall not pass'});
      }
      const [bearer, token] = req.header('Authorization').split(' ');
      if (bearer !== 'Bearer' || !token) {
        return res.status(401).send({
          error: 'Not authenticated'
        });
      }
      try {
        const user = this.verifySession(token);
        const unused = user.toLowerCase(); // Check is user isnt undefined, otherwise throw error
        next();
      } catch (err) {
        if (err.isBoom) {
          return res
            .status((err as Boom.BoomError).output.statusCode)
            .send({error: (err as Boom.BoomError).message});
        }
        res.status(500).send({error: 'Unexpected error while verifying session token'});
      }
    }
  }
  /**
   * Create a session upon reaching this endpoint
   */
  signinUser (): Express.RequestHandler {
    return (req, res, next) => {
      this.createSession(req.body.username, req.body.password).then((token) => {
         return res.status(201).send({
           ok: true,
           token
         });
      }).catch((err) => {
        if (err.isBoom) {
          const boom = err as Boom.BoomError;
          res.status(boom.output.statusCode).send({
            error: boom.message
          })
        }
      });
    }
  }
  signupUser (): Express.RequestHandler {
    return (req, res, next) => {

      assert.equal(req.method.toLowerCase(), 'post');
      this.registerUser(Object.assign({}, req.body, {
        role: 'end_user'
      })).then(() => {
        res.status(201).send({
          ok: true,
          message: 'User created'
        });
      }).catch((err) => {
        if (err.isBoom) {
          return res
            .status((err as Boom.BoomError).output.statusCode)
            .send({error: (err as Boom.BoomError).message});
        }
        res.status(500).send({error: 'Unexpected error while creating user'});
      });
    }
  }

  proxyRequestDecorator () {
    return (proxyReqOpts: any, srcReq: any) => {

      if (process.env.ADMIN_PARTY) {
        const auth = new Buffer(PouchDB.credentials).toString('base64');
        proxyReqOpts.headers.authorization = `Basic ${auth}`;
        return proxyReqOpts;
      }

      if (!proxyReqOpts.headers.authorization) {
        throw new Error('Please provide a token');
      }

      const [bearer, token] = proxyReqOpts.headers.authorization.split(' ');
      const user = this.verifySession(token);
      
      const auth = new Buffer(`${user}:${this.passwords[user]}`)
        .toString('base64')
      proxyReqOpts.headers.authorization = `Basic ${auth}`;

      return proxyReqOpts;
    }
  }

}
