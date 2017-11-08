import jwt from './jwt';
import * as events from 'events';
import * as Express from 'express';
import * as SocketIO from 'socket.io';
import {mainStory} from 'storyboard';
import config from './config';
import Authenticator from './features/authenticator'

class HttpEventEmitter extends events.EventEmitter {
  private io: SocketIO.Server;
  constructor() {
    super();
  }

  createEventThread (event: string, onListen: Function = () => {}) {
    this.on('listen', (evt: string) => {
      
      if (event === evt) {
        onListen();
      }
    });
    return jwt.sign({
      event
    }, {expiresIn: '1d', subject: 'event'});
  }
  getEventThread (token: string): {event: string} {
    return jwt.verify(token, {subject: 'event'}) as any;
  }
  attach (app: Express.Application, auth: Authenticator) {
    this.io = SocketIO(app);

    this.on('client_call', (data: any) => {
      this.io.emit('client_call', data);
    });

    Object.keys(this.io.nsps).forEach((namespace) => {
      const nsp = this.io.nsps[namespace];
      nsp.on('connect', (socket: SocketIO.Socket & {auth?: string}) => {
        if (!socket.auth) {
          mainStory.info('socket', `Removing socket ${socket.id} from ${namespace}`);
          delete nsp.connected[socket.id];
        }
      });
    });

    this.io.on('server_call', (data: any) => {
      this.emit('server_call')
    });

    this.io.on('connection', (socket: SocketIO.Socket & {auth?: string}) => {
      mainStory.info('socket', `Connected to ${socket.handshake.address} via ${socket.handshake.url} [${socket.id}]`);
      socket.on('authenticate', (data: {token: string}) => {
        try {
          const user = auth.verifySession(data.token);
          if (user && user !== '') {
            mainStory.info('socket', `Socket ${socket.id} authenticated as ${user}`);
            socket.auth = user;
            Object.keys(this.io.nsps).forEach((namespace) => {
              mainStory.info('socket', `Retablishing socket ${socket.id} for ${namespace}`);
              const nsp = this.io.nsps[namespace];
              nsp.connected[socket.id] = nsp.sockets[socket.id];
            });      
          }
        } catch (err) {
          mainStory.warn('socket', `Could not verify session [${socket.id}]`, {
            attach: err
          });
          return;
        }
      });
    
      socket.on('listen', (data: any) => {
        if (!socket.auth) return;
        mainStory.debug('socket', `Trying to listen to an event... [${socket.id}]`);
        if (!data.token) return socket.emit('remote_error', {code: 400, message: 'Emitted a listen event without a token'});
        try {
          const thread = this.getEventThread(data.token)

          // Transmit the event from server to client
          this.on(thread.event, (data: any) => {
            this.io.emit(thread.event, data);
          });

          mainStory.info('socket', `Listening to event ${thread.event} [${socket.id}]`)

          // Inform we are watching
          process.nextTick(() => this.emit('listen', thread.event));

        } catch (err) {
          return socket.emit('remote_error', {code: 403, message: 'Emitted a listen event without a valid token'});
        }
      });
      setTimeout(() => {
        if (!socket.auth) {
          mainStory.info('socket', `Disconnecting ${socket.id} because it didn't authenticated under 10s`);
          socket.disconnect();
        }
      }, 10000);
    });
  }
}
const emitter = new HttpEventEmitter();
export default emitter;