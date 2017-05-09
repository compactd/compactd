
import PouchDB from '../../database';
import * as fs from 'fs';
import * as path from 'path';
import {trackURI, File} from 'compactd-models';
import * as jwt from 'jsonwebtoken';
import * as assert from 'assert';
import config from '../../config'; 

export async function createSession (id: string) {
  const files = new PouchDB<File>('files');

  const docs = await files.allDocs({
    include_docs: true,
    startkey: id,
    endkey: id + '\uffff'
  });
  const file = docs.rows[0].doc;

  return jwt.sign({typ: 'dt', fil: file.path}, config.get('secret'), {expiresIn: '1d'});
}

export function readToken (token: string) {
  const {fil, typ} = jwt.decode(token, config.get('secret'));
  assert.equal(typ, 'dt');
  return fil;
} 