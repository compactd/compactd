import fetch from 'node-fetch';
import {Album, Artist} from 'compactd-models';
import {MediaSource} from '../datasource';
import PouchDB from '../../database';
import * as fs from 'fs';
import * as path from 'path';
import * as mkdirp from 'mkdirp';
import * as sharp from 'sharp';
import * as mime from 'mime';
import config from '../../config';
import * as md5 from 'md5';
import {mainStory} from 'storyboard';
import {SchedulerFunc} from '../scheduler/Scheduler';
import * as cheerio from 'cheerio';

const base = 'https://www.discogs.com';

async function getBestSearchResult (url: string, title: string) {
  const res = await fetch(url);

  const html = await res.text();

  const $ = cheerio.load(html);

  const a = $(`.search_result_title[title='${title}']`).get(0);

  if (!a || !a.parent || !a.parent.parent) {
    return null;
  }

  return a.parent.parent.attribs["data-object-id"];
}

async function getHQImage (url: string) {
  const res = await fetch(url);
  const html = await res.text();
  const $ = cheerio.load(html);

  const img = $('#view_images > p > span > img').get(0);

  if (!img) return;

  return img.attribs['src'];
}

async function getEntName (ent: Artist|Album)  {
  if (ent.artist) {
    const album = <Album>ent;
    const artists = new PouchDB<Artist>('artists');
    const artist = await artists.get(album.artist);
    return `${artist.name} - ${ent.name}`;
  }
  return ent.name;
}

export async function downloadHQCover (ent: Artist|Album) {
  const artworks = new PouchDB('artworks');
  const docId = 'artworks/' + ent._id;
  const type = ent.artist ? 'release' : 'artist';

  try {
      const art = await artworks.get(docId);
      if (art._attachments.hq) {
        mainStory.trace('aquarelle', `Skipping artwork ${ent._id}`);
        return;
      }
  } catch (ignored) {}
  
  mainStory.debug('aquarelle', `Fetching artwork for ${ent._id}`);

  const url = `${base}/search/?q=${encodeURIComponent(await getEntName(ent))}&type=${type}`;

  const id = await getBestSearchResult(url, ent.name);

  if (!id) {
    return;
  }

  const next = `${base}/${type}/${id}/images`; 
  const hq = await getHQImage(next);

  if (!hq) return;

  mainStory.debug('aquarelle', `Found those images for ${ent._id}`, {
    attach: {hq}
  });

  await saveArtwork(ent._id, hq);
}

async function saveArtwork (id: string, url: string) {
  const artworks = new PouchDB('artworks');
  const docId = 'artworks/' + id;

  try {
    await artworks.get(docId);
  } catch (err) {
    await artworks.put({
      _id: docId,
      owner: id,
      date: Date.now()
    });
  } finally {
    let doc = await artworks.get(docId);
    const buffer = await (await fetch(url)).buffer();

    const image = sharp(buffer);

    const metadata = await image.metadata();
    const mimeType = mime.getType(metadata.format);
    await artworks.putAttachment(docId, 'hq', doc._rev, buffer, mimeType);
    doc = await artworks.get(docId);
    await artworks.putAttachment(docId, 'large', doc._rev, await image.resize(300).toBuffer(), mimeType);
    doc = await artworks.get(docId);
    await artworks.putAttachment(docId, 'small', doc._rev, await sharp(buffer).resize(64).toBuffer(), mimeType);
  }
}

export default async function discogsTasks () {
  const albums  = new PouchDB<Album>('albums');
  const artists = new PouchDB<Artist>('artists');
  return await Promise.all((await artists.allDocs({include_docs: false}))
    .rows.concat((await albums.allDocs({include_docs: false})).rows).map(async ({id}) => {
      try {
        const artist = await artists.get(id);
        return () => downloadHQCover(artist);
      } catch (ignored) {
        const album = await albums.get(id);
        return () => downloadHQCover(album);
      }
  }));
}

export function processAll () {
  return discogsTasks().then((q) => {
    return q.reduce((acc, func) => {
      return acc.then(() => func()).catch((err) => func());
    }, Promise.resolve());
  }).catch((err) => {
    console.log(err);
  })
}