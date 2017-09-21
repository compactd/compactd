
import jwt from './jwt';
import * as events from 'events';
import * as Express from 'express';
import * as SocketIO from 'socket.io';

class HttpEventEmitter extends events.EventEmitter {
  private io: SocketIO.Server;
  constructor() {
    super();
  }
  createEventThread (event: string, onListen: Function = () => {}) {
    this.on(event, onListen);
    return jwt.sign({
      event
    }, {expiresIn: '1d', subject: 'event'});
  }
  getEventThread (token: string): {event: string} {
    return jwt.verify(token, {subject: 'event'});
  }
  attach (app: Express.Application) {
    this.io = SocketIO(app);

    this.io.on('connection', (socket) => {
      socket.on('listen', (data: any) => {
        if (!data.token) return socket.emit('error', {code: 400, message: 'Emitted a listen event without a token'});
        try {
          const thread = this.getEventThread(data.token);
          this.on(thread.event, (data: any) => {
            this.io.emit(thread.event, data);
          });
          
          process.nextTick(() => this.emit('listen', thread.event));

        } catch (err) {
          return socket.emit('error', {code: 403, message: 'Emitted a listen event without a valid token'});
        }
      });
    });
  }
}
const emitter = new HttpEventEmitter();
export default emitter;