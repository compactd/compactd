import jwt from "./jwt";
import Authenticator from "./features/authenticator/Authenticator";
import config from "./config";

const socketPouchServer = require('socket-pouch/server');
const auth = new Authenticator('proxy', config.get('secret'));
socketPouchServer.listen(9001, {
  pouchCreator: async function (token: string) {
    return {pouch: await auth.proxyPouchCreator(token, 's_')};
  }
}, function () {
  // server started
});