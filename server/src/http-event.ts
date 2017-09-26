import jwt from './jwt';
import * as events from 'events';
import * as Express from 'express';
import * as SocketIO from 'socket.io';
import {mainStory} from 'storyboard';

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
  attach (app: Express.Application) {
    this.io = SocketIO(app);

    this.io.on('connection', (socket) => {
      mainStory.info('socket', `Connected to ${socket.handshake.address} via ${socket.handshake.url} [${socket.id}]`);
      socket.on('listen', (data: any) => {
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
    });
  }
}
const emitter = new HttpEventEmitter();
export default emitter;