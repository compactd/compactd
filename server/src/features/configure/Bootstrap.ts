import {StandaloneDatabaseApplication} from './StandaloneDatabaseApplication';
import {Message} from './Configure.d';

process.on('message', function (message: Message) {
  switch (message.type) {
    case 'START_SERVER':
      const app = new StandaloneDatabaseApplication(
        message.data.host, message.data.port);
      app.start().then(() => {
        process.send({type: 'SERVER_STARTED'} as Message);
      });
  }
});
