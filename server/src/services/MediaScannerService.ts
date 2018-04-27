import { Component } from '@nestjs/common';
import ffmpeg from 'fluent-ffmpeg';
import { readFile, statSync } from 'fs';
import * as mime from 'mime-types';
import { dirname, join } from 'path';
import { PouchFactory } from 'slothdb';
import { v4 } from 'uuid';

import Album from 'shared/models/Album';
import Artist from 'shared/models/Artist';
import File, { FileEntity, FileIndex } from 'shared/models/File';
import Library from 'shared/models/Library';
import ResourceType from 'shared/models/ResourceType';
import Track from 'shared/models/Track';

import Debug from 'debug';

const debug = Debug('compactd:media-scanner');
const warn = Debug('compactd:media-scanner:warn');
const walk = require('walk');

@Component()
export default class MediaScannerService {
  public async runScan(factory: PouchFactory<any>, libraryId: string) {
    debug('Starting scan...');
    const library = await Library.findById(factory, libraryId);

    await this.scanFolderAndCreateFiles(factory, library._id, library.path);

    const filesToProcess: FileEntity[] = await File.queryDocs(
      factory,
      FileIndex.UnprocessedFiles
    );

    const filesByAlbum: {
      [album: string]: FileEntity[];
    } = filesToProcess.reduce((acc, file) => {
      if (!file.tags || !file.tags.album) {
        return acc;
      }
      const { album } = file.tags as { album: string };
      return Object.assign(acc, {
        [album]: (acc[album] || []).concat(file)
      });
    }, {});

    const jobs = Object.keys(filesByAlbum).map(albumName => {
      return async () => {
        const files = filesByAlbum[albumName];
        const artistName = this.getArtistNameForArray(
          files.map(({ tags }) => tags.album_artist || tags.artist)
        );

        const artist = await Artist.create(factory, { name: artistName });

        if (!await artist.exists()) {
          debug(`Creating artist %o`, artist.getDocument());
          await artist.save();
        }

        const album = await Album.create(factory, {
          artist: artist._id,
          name: albumName
        });

        if (!await album.exists()) {
          debug(`Creating album %o`, album.getDocument());
          await album.save();
        }
        await Promise.all(
          files.map(async file => {
            switch (file.resourceType) {
              case ResourceType.AUDIO:
                if (file.tags) {
                  const { title, duration, ...tags } = file.tags;
                  const disc = this.parseDiscNumber(tags);
                  const index = this.parseTrackNumber(tags);
                  const ent = await Track.put(factory, {
                    album: album._id,
                    artist: artist._id,
                    disc,
                    duration,
                    file: file.path,
                    name: title,
                    number: index,
                    position: this.getPosition(disc, index.toString())
                  });

                  file.resourceID = ent._id;
                  await file.save();
                }
                break;
              default:
                break;
            }
          })
        );
      };
    });

    await jobs.reduce(
      (promise, fn) =>
        promise.then(() => fn()).catch(err => {
          debug('Error processing file entity %O', err);
          return Promise.resolve();
        }),
      Promise.resolve()
    );
  }
  private getArtistNameForArray(names: string[]) {
    const commonArtistName = names
      .sort(
        (a, b) =>
          names.filter(v => v === a).length - names.filter(v => v === b).length
      )
      .pop();

    if (
      commonArtistName &&
      names.filter(name => name === commonArtistName).length >= names.length / 2
    ) {
      // then at least 50% of artist names is the commonArtistName, we can safely assume
      // That this is indeed our album's artist

      return commonArtistName;
    }

    return 'Various Artists';
  }

  private async scanFolderAndCreateFiles(
    factory: PouchFactory<any>,
    libraryId: string,
    path: string
  ) {
    const filePaths = await File.queryKeys(factory, FileIndex.ByPath);

    await new Promise((resolve, reject) => {
      const walker = walk.walk(path, {});
      walker.on('file', (root, { name, ...props }, next) => {
        const filePath = join(root, name);

        if (filePaths.includes(filePath)) {
          return;
        }
        const type = mime.lookup(name);

        if (!type) {
          return next();
        }
        if (/^audio\//.test(type)) {
          const { mtime } = statSync(filePath);
          return ffmpeg.ffprobe(filePath, (err, data) => {
            if (err) {
              warn(`An error occured while reading file '%s': %O`, name, err);
              return next();
            }
            const { duration } = data.streams[0];
            return File.put(factory, {
              dir: dirname(name),
              library: libraryId,
              mimeType: type,
              mtime: mtime.getTime() / 1000,
              path: filePath,
              resourceType: ResourceType.AUDIO,
              tags: Object.keys(data.format.tags).reduce(
                (acc, key) => {
                  if (/brainz|acoustid|script|wm\//i.test(key)) {
                    return acc;
                  }
                  return {
                    ...acc,
                    [key.toLocaleLowerCase()]: data.format.tags[key]
                  };
                },
                { duration: duration !== 'N/A' ? duration : 0 }
              )
            })
              .then(() => next())
              .catch((error: any) => {
                warn('Unable to access database: %O', error);
              });
          });
        }

        next();
      });

      walker.on('errors', (root, nodeStatsArray, next) => {
        debug(`Walker received errors for %s: %O`, root, nodeStatsArray);
        next();
      });

      walker.on('end', () => {
        debug('Finished scanning library');
        resolve();
      });
    });
  }
  private padStart(padding: string, str: string) {
    return `${padding}${str}`.slice(-padding.length);
  }
  private getPosition(disc: string, index: string) {
    return `${this.padStart('0', disc)}.${this.padStart('00', index)}`;
  }
  private parseNumber(str: string) {
    if (!str) {
      return 0;
    }
    const match = str.match(/(\d+).*/);

    if (!match) {
      return 0;
    }

    const [omit, num] = match;

    return +num;
  }
  private parseDiscNumber({ disc }: any) {
    return this.parseNumber(disc).toString();
  }
  private parseTrackNumber({ track }: any) {
    return this.parseNumber(track);
  }
}
