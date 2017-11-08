import FFmpeg = require('fluent-ffmpeg');
import * as fs from 'fs';
import * as mkdirp from 'mkdirp';
import * as path from 'path';
import config from '../../config';
import * as util from 'util';
import sha1 = require('sha1');
import * as shortid from 'shortid';
import * as qs from 'qs';
import {mainStory} from 'storyboard';
import * as assert from 'assert';

export type ConstantEncodingOptions = {
  format: 'mp3',
  /**
   * Sets a constant bitrate
   */
  bitrate: number,
  /**
   * Describes how large the cache is allowed to be for this preset
   */
  cache_size: number
}

export type VBREncodingOptions = {
  format: 'mp3',
  /**
   * Set the audio quality for a constant bitrate 
   */
  quality: number,
  /**
   * Describes how large the cache is allowed to be for this preset
   */
  cache_size: number
}

export type TranscodeOptions = ConstantEncodingOptions | VBREncodingOptions

export type EncoderOptions = ({
  format: 'original',
  name: string
} | TranscodeOptions & {
  name: string
});

const ENCODERS = {
  mp3: 'libmp3lame'
}

export const ENCODER_PRESETS: {
  [name: string]: EncoderOptions
} = {
  low: {
    format: 'mp3',
    quality: 4,
    name: 'low',
    cache_size: 64,
  },
  normal: {
    format: 'mp3',
    quality: 2,
    cache_size: 64,
    name: 'string'
  },
  high: {
    format: 'mp3',
    quality: 0,
    cache_size: 24,
    name: 'high'
  },
  original: {
    format: 'original',
    name: 'original'
  }
}

export default class Encoder {
  public static INSTANCE = new Encoder(ENCODER_PRESETS.normal);
  public static MAX_CACHE_LENGTH = 64;
  private opts: EncoderOptions;
  private listeners: {
    [name: string]: Function[]
  } = {};
  private cache: {
    [name: string]: string[]
  } = {};
  private hashCash: {
    [input: string]: string
  } = {}

  private constructor (quality: EncoderOptions) {
    this.opts = quality;
    this.loadCache();
  }

  public setEncoderOptions (opts: EncoderOptions) {
    this.opts = opts;
    this.cache[opts.name] = this.cache[opts.name] || [];
  }

  createCache () {
    return new Promise((resolve) => {
      const folder = path.join(config.get('dataDirectory'), 'cache');
      mkdirp(folder, (err) => {
        resolve();
      });
    })
  }

  on (event: string, handler: Function) {
    this.listeners[event] = [].concat(this.listeners[event] || [], handler);
  }

  getCacheFolder () {
    return path.join(config.get('dataDirectory'), 'cache');
  }
  getCacheFile (filename: string) {
    return path.join(config.get('dataDirectory'), 'cache', filename);
  }

  getCache (input: string) {
    assert(this.opts.format !== 'original');

    const {name} = this.opts;
    const id = input + '?' + qs.stringify(this.opts);
    mainStory.info('encoder', 'loading cache ' + id);
    const hash = this.hashCash[id] ? this.hashCash[id] : name + '-' + sha1(id);
    this.hashCash[id] = hash;
    
    if (this.cache[name].includes(hash)) {
      const pos = this.cache[name].indexOf(hash);

      // Send cache[name] entry to top
      this.cache[name].splice(pos, 1);
      this.cache[name].unshift(hash);
      return [this.getCacheFile(hash), this.getCacheFile(hash)];
    } else {
      this.cache[name].unshift(hash);

      // if the max cache[name] length is reached, remove the least used entry
      if (this.cache[name].length > (<TranscodeOptions>this.opts).cache_size) {
        const [removed] = this.cache[name].splice(-1, 1);
        fs.unlinkSync(this.getCacheFile(removed));
      }
      return [null, this.getCacheFile(hash)];
    }
  }

  async loadCache () {
    const readdir = util.promisify(fs.readdir);
    await this.createCache();
    const files = await readdir(this.getCacheFolder());
    files.forEach((file) => {
      const [name, hash] = file.split('-');
      this.cache[name] = (this.cache[name] || []).concat(file);
    });
  }

  /**
   * Encode a file to a temporary location and read it
   * @param file the input file
   */
  run (file: string): Promise<Buffer>;
  /**
   * 
   * @param file 
   * @param out 
   */
  run (file: string, out: string): Promise<void>;
  run (file: string, out: fs.WriteStream): void;
  run (file: string, out?: string | fs.WriteStream): any {
    const readFile = util.promisify(fs.readFile);
    const writeFile = util.promisify(fs.writeFile);

    if (this.opts.format === 'original') {
      if (!out) {
        return readFile(file);
      }
      if (typeof out == 'string') {
        return readFile(file).then((buffer) => {
          writeFile(out, buffer);
        });
      } else {
        fs.createReadStream(file).pipe(out);
        return;
      }
    }

    const [cached, target] = this.getCache(file);

    if (cached) {
      if (!out) {
        return readFile(cached);
      }
      if (typeof out == 'string') {
        return readFile(cached).then((buffer) => {
          writeFile(out, buffer);
        });
      } else {
        fs.createReadStream(cached).pipe(out);
      }
    }


    const command = FFmpeg(file, {});

    command.audioCodec(ENCODERS[this.opts.format]);
    command.format(this.opts.format);

    Object.keys(this.listeners).forEach((event) => {
      this.listeners[event].forEach((handler) => {
        console.log(event, handler);
        
        command.on(event, handler as any);
      });
    });

    if ((<ConstantEncodingOptions>this.opts).bitrate) {
      command.audioBitrate((<ConstantEncodingOptions>this.opts).bitrate);
    } else {
      command.audioQuality((<VBREncodingOptions>this.opts).quality);
    }
    if (!out) {
      return this.createCache().then(() => {
        return new Promise((resolve, reject) => {
          command.on('end', () => {
            readFile(target).then((buffer) => {
              resolve(buffer);
            }).catch((err) => {
              reject(err);
            });
          });
          command.save(target);
        })
      })
    }
    if (typeof out == 'string') {
      return new Promise((resolve, reject) => {

        command.on('end', () => {
          readFile(target).then((buffer) => {
            return writeFile(out, buffer);
          }).then(() => {
            resolve();
          }).catch((err) => {
            reject(err);
          });
        });

        command.save(target);
      })
    } else {
      command.pipe(out);
    }
  }
}