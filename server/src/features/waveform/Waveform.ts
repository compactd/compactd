import PouchDB from '../../database';
import {trackURI, File} from 'compactd-models';
import * as fs from 'fs-extra';
import config from '../../config';
import sha1 = require('sha1');
import * as mkdirp from 'mkdirp';
import * as path from 'path';
import * as shortid from 'shortid';
import * as qs from 'qs';
import {exec} from 'child_process';

const WaveformData = require('waveform-data');

const hashCash: {[name: string]: string} = {};

function waveformCLI(mediaFile: string, imageFile: string) {
  return `audiowaveform -i '${mediaFile}' -b 8 -z 256 -o '${imageFile}'`;
}
 
function generateWaveform(mediaFile: string, imagePath: string) {

  return new Promise((resolve, reject) => {
    exec(waveformCLI(mediaFile, imagePath), function (error, stdout, stderr) {
      if (error) {
        return reject(error);
      }
      resolve(error);
    });
  })
}

async function processFile (file: string) {
  await generateWaveform(file, getCacheEntry(file));
  return fs.readFile(getCacheEntry(file));
}

function getCacheEntry (file: string): string {
  const id = file + '?' + qs.stringify({});
  const hash = hashCash[id] ? hashCash[id] : sha1(id);
  return path.join(getCacheDir(), hash + '.dat');
}

async function getData (id: string) {
  const file = await getFileFromTrack(id);
  const cache = getCacheEntry(file.path);
  if (await fs.pathExists(cache)) {
    return fs.readFile(cache);
  }
  const data = processFile(file.path);
  return data;
}

export default {
  getData
}

async function getFileFromTrack(id: string) {
  const files = new PouchDB<File>('files');
  const docs = await files.allDocs({
    include_docs: true,
    startkey: id,
    endkey: id + '\uffff'
  });
  const file = docs.rows[0].doc;
  return file;
}

function getCacheDir(): string {
  return path.join(config.get('dataDirectory'), 'waveforms');
}

mkdirp.sync(getCacheDir());