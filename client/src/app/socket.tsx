
import * as jwtDecode from 'jwt-decode';
import * as io from 'socket.io-client';
import Toaster from 'app/toaster';
import * as events from 'events';
import Session from './session';

class SocketEventEmitter {
  private socket: SocketIOClient.Socket;
  constructor() {
  }
  onClientCall (method: string, cb: (...args: any[]) => void) {
    this.socket.on('client_call', (data: any) => {
      if (data.method === method) {
        cb(...data.args);
      }
    })
  }
  connect () {
    
    this.socket = io.connect();
  
    (window as any).socket = this.socket;

    this.socket.on('connect', () => {
      setTimeout(() => {

        this.socket.emit('authenticate', {token: Session.getToken()});
      }, 100)
      Toaster.show({
        icon: 'feed-subscribed' as any,
        intent: 'NONE',
        message: 'Socket.io is now connected'
      });
    });

    this.socket.on('disconnect', () => {
      Toaster.show({
        icon: 'offline',
        intent: 'WARNING',
        message: 'Socket.io is disconnected'
      });
    });

    this.socket.on('reconnect', () => {
      Toaster.show({
        icon: 'cell-tower',
        message: 'Socket.io is now reconnected'
      });
    });

    this.socket.on('error', (err: Error) => {
      console.log(err);

      Toaster.error(err);
    })
    this.socket.on('remote_error', (err: any) => {
      console.log(err);
      
      Toaster.error('Remote error: ' + err.message);
    });

  }
  listen (event: string, token: string | Function, callback?: Function): void {
    if (typeof token === 'function') {;
      
      return this.listen((jwtDecode(event) as any).event, event, token);
    }
    this.socket.on(event, callback);
    this.socket.emit('listen', {token});
  }
}

const Socket = new SocketEventEmitter();

export default Socket;