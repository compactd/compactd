'use strict';

// Shamelessly stolen from:
// https://github.com/jfurrow/flood/blob/master/server/util/scgi.js
// thanks to jfurrow!

const Deserializer = require('xmlrpc/lib/deserializer');
const Serializer   = require('xmlrpc/lib/serializer');
import * as net from 'net';
import * as fs from 'fs';
import {mainStory} from 'storyboard';
import {Commands} from './rTorrent';

export default {
  methodCall: (methodName: Commands, parameters: (string | Buffer)[], host: string, port: number) => {

    let connectMethod = {port: port, host: host};
    let deserializer = new Deserializer('utf8');
    let headerLength = 0;
    let nullChar = String.fromCharCode(0);
    let stream = net.connect(connectMethod);
    let xml = Serializer.serializeMethodCall(methodName, parameters);

    stream.setEncoding('UTF8');

    let headerItems = [
      `CONTENT_LENGTH${nullChar}${xml.length}${nullChar}`,
      `SCGI${nullChar}1${nullChar}`
    ];

    headerItems.forEach((item) => {
      headerLength += item.length;
    });

    let header = `${headerLength}:`;

    headerItems.forEach((headerItem) => {
      header += headerItem;
    });

    stream.write(`${header},${xml}`);

    let time = Date.now();

    return new Promise((resolve, reject) => {
      deserializer.deserializeMethodResponse(stream, (error: Error, response: any) => {
        if (error) {
          return reject(error);
        }
        mainStory.trace('scgi', `Called ${methodName} on ${host}:${port} in ${Date.now() - time}ms`, {
          attach: response
        });
        return resolve(response);
      });
    });
  }
}