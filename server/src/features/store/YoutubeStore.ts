import Store from "./Store";
import fetch from "node-fetch";
import * as qs from "qs";
import * as path from 'path';
import ResultEntry from "./ResultEntry";
import { URL } from "url";
import { spawn } from "child_process";
import { EventEmitter } from "events";
import { mainStory } from "storyboard";
import HashMap from "../../helpers/HashMap";
import * as urljoin from 'url-join';
import * as cheerio from "cheerio";
import PouchDB from '../../database';
import * as slug from 'slug';
import { albumURI, mapAlbumToParams, Artist, artistURI } from "compactd-models/dist";
import * as assert from 'assert';
import { runInNewContext, runInContext, createContext } from "vm";
import { writeFile } from "fs";
import { promisify } from "util";
import { join } from "path";
import * as mkdirp from 'mkdirp';
import * as filenamify from 'filenamify';
import { Scanner } from "../scanner/Scanner";
import { removeRedundantText } from "./utils";
import * as ytdl from 'ytdl-core';
import FFmpeg = require('fluent-ffmpeg');

interface YTAccessibility {
  accessibility?: {
    accessibilityData : {
      label: string;
    }
  }
  simpleText: string;
}

interface YTInitialData<T = {}, S = {}> {
  responseContext: any;
  estimatedResults: number;
  contents: T;
  trackingParams: string;
  topbar: any;
  sidebar: S;
  adSafetyReason: any;
}
type YTInfo = {
  title: string;
  videos: {
    title: string;
    index: number;
    id: string;
  }[]
}

interface Runnable {
  runs: {
    text: string;
    navigationEndpoint: any;
  }[]
}

interface YTSearchData {
  twoColumnSearchResultsRenderer: {
    primaryContents: {
      sectionListRenderer: {
        contents: [{
          itemSectionRenderer: {
            contents: ({
              playlistRenderer: {
                playlistId: string;
                title: YTAccessibility;
                thumbnails: any[];
                videoCount: number;
                navigationEndpoint: any;
                viewPlaylistText: any;
                shortBylineText: any;
                videos: any[];
                trackingParams: string;
                thumbnailText: any;
                longBylineText: any;
                thumbnailRenderer: any;
                thumbnailOverlays: any;
              }
            } | {
              videoRenderer: {
                videoId: string;
                title: YTAccessibility;
                lengthText: YTAccessibility;
              }
            })[] 
          }
        }],
        trackingParams: string;
        subMenu: any;
      }
    }
  }
}
interface YTSearchSidebar {
  playlistSidebarRenderer: {
    items: {
      playlistSidebarPrimaryInfoRenderer: {
        title: Runnable
      }
    }[]
  }
}

interface YTVideoData {
  twoColumnWatchNextResults:  {
    results: {
      results: {
        contents: ({
          videoPrimaryInfoRenderer: {
            title: YTAccessibility;
            viewCount: {
              videoViewCountRenderer: {viewCount: YTAccessibility, shortViewCount: YTAccessibility}
            }
          },
          videoActions: any;
          trackingParams: string;
          sentimentBar: any;
        })[]
      }
    }
  }
}

interface YTPlaylistData {
  twoColumnBrowseResultsRenderer: {
    tabs: [{
      tabRenderer: {
        selected: boolean,
        content: {
          sectionListRenderer: {
            contents: [{
              itemSectionRenderer: {
                contents: [{
                  playlistVideoListRenderer: {
                    contents: ({
                      playlistVideoRenderer: {
                        videoId: string;
                        thumbnail: any;
                        title: YTAccessibility;
                        index: YTAccessibility;
                        shortBylineText: YTAccessibility;
                        lengthText: YTAccessibility;
                        navigationEndpoint: any;
                        lengthSeconds: number;
                        trackingParams: string;
                        isPlayable: true;
                        menu: any;
                        isWatched: boolean;
                        thumbnailOverlays: any[];
                      }
                    })[]
                  }
                }]
              }
            }]
          }
        }
      }
    }]
  };
}

export class YoutubeStore extends Store {
  public name: string = 'youtube';
  public constructor (opts: void, id: string) {
    super([], {}, id);
  }
  async getYoutubeInitalData<T, S = {}> (url: string) {
    const res = await fetch('https://www.youtube.com' + url, {headers: {'user-agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_12_6) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/64.0.3282.186 Safari/537.36'}});
    const text = await res.text();
    const $ = cheerio.load(text);
    
    const scripts = $('script').filter((index, el) => {
      // The script tags we ant doesn't have any attributes
      return Object.keys(el.attribs).length === 0;
    }).filter(function (index, el) {
      const content = el.children[0].data;
      // And its contents starts with webpackJsonP
      return content && /^\s+window\["ytInitialData"\]/.test(content);
    });

    assert.equal(scripts.length, 1);
    
    const content = scripts[0].children[0].data;
    const data: any = {};
    
    // This runs the script and emulate the webpackJsonp function
    // So it assigns data to the registry object
    const context = createContext({
      window: data
    });

    runInContext(content, context, {
      filename: url
    });

    return data.ytInitialData as YTInitialData<T, S>;
  }

  authenticate(): Promise<void> {
    return Promise.resolve();    
  }
  
  async search(artist: string, album: string): Promise<ResultEntry[]> {
    const url = `/results?search_query=${artist} - ${album}`
    const {contents} = await this.getYoutubeInitalData<YTSearchData>(url);

    if (!contents.twoColumnSearchResultsRenderer) {
      return [];
    }

    const [{itemSectionRenderer}] = contents.twoColumnSearchResultsRenderer.primaryContents.sectionListRenderer.contents;

    return itemSectionRenderer.contents.filter((el) => 'playlistRenderer' in el || 'videoRenderer' in el).map((content) => {
      if ('playlistRenderer' in content) {
        const {title, playlistId, videoCount} = content.playlistRenderer;
        return {
          _id: path.join('results', slug(artist, {lower: true}), slug(album, {lower: true}), this.name, 'playlists', playlistId),
          name: title.simpleText,
          store: 'stores/' + this.name,
          format: 'mp3',
          sid: path.join('playlists', playlistId),
          stats: [{
            icon: 'list',
            name: 'Video Number',
            desc: 'How many videos',
            value: videoCount.toString()
          }],
          labels: {'playlist': 'A playlist with several videos'}
        };
      } else {
        const {title, videoId, lengthText} = content.videoRenderer;
        
        return {
          _id: path.join('results', slug(artist, {lower: true}), slug(album, {lower: true}), this.name, 'videos', videoId),
          name: title.simpleText,
          store: 'stores/' + this.name,
          format: 'mp3',
          sid: path.join('videos', videoId),
          stats: [{
            icon: 'video',
            name: 'Video Length',
            desc: 'Video length',
            value: lengthText.simpleText
          }],
          labels: {'video': 'A single video'}
        };
      }
    });
  }

  async fetchPlaylistInfo (id: string): Promise<YTInfo> {
    const {contents, sidebar} = await this.getYoutubeInitalData<YTPlaylistData, YTSearchSidebar>(`/playlist?list=${id}`); 
    const title = sidebar.playlistSidebarRenderer.items[0].playlistSidebarPrimaryInfoRenderer.title.runs[0].text;
    const [{tabRenderer}] = contents.twoColumnBrowseResultsRenderer.tabs;
    const [data] = tabRenderer.content.sectionListRenderer.contents[0].itemSectionRenderer.contents;
    const vids = data.playlistVideoListRenderer.contents;

    const videos = vids
      .filter((el) => "playlistVideoRenderer" in el)
      .map(({playlistVideoRenderer}) => {
        return {
          title: playlistVideoRenderer.title.simpleText,
          id: playlistVideoRenderer.videoId,
          index: +playlistVideoRenderer.index.simpleText
        }
      });

    return {title, videos};
  }

  async fetchVideoInfo (id: string): Promise<YTInfo> {
    const {contents} = await this.getYoutubeInitalData<YTVideoData>(`/watch?v=${id}`);

    const data = contents.twoColumnWatchNextResults.results.results.contents;

    const renderer = data.find((el) => 'videoPrimaryInfoRenderer' in el);

    const {simpleText} = renderer.videoPrimaryInfoRenderer.title;

    return {title: simpleText, videos: [{
      id, title: simpleText, index: 0
    }]};
  }

  async _fetchResult(sid: string) {
    const [results, artist, album, name, type, id] = sid.split('/');
    assert.equal(name, this.name);

    const downloads = new PouchDB<any>('downloads');
    const libraries =  new PouchDB('libraries');
    const artists =  new PouchDB<Artist>('artists');

    const info = await (type === 'videos' ? this.fetchVideoInfo(id) : this.fetchPlaylistInfo(id));

    const title = removeRedundantText(info.title, artist);

    const author = await artists.get(artistURI({name: artist}));

    const dlId = path.join('downloads', slug(artist.toLowerCase()), slug(album.toLowerCase()), this.name, sid);

    downloads.put({
      _id: dlId,
      name: title, sid, artist: author._id,
      album: albumURI(mapAlbumToParams({name: album, artist: author._id})),
      store: this.name, date: Date.now(), progress: 0
    });

    const [{doc}] = (await libraries.allDocs({include_docs: true, limit: 1})).rows;

    const dirname = filenamify(author.name + ' - ' + title);
    const dir = join((doc as any).path, dirname);

    await promisify(mkdirp)(dir, {});
    
    let done = 0;

    mainStory.info('store', 'Download from youtube', {attach: info});

    const fns = info.videos.map((video, index, arr) => {
      return () => {
        return new Promise<void>((resolve, reject) => {

          const stream = ytdl(video.id, {quality: 'highestaudio'});
          const number = ('0' + (+video.index + 1)).slice(-2);
          const itemTitle = removeRedundantText(video.title, artist, album, (video.index + 1).toString(), number);
          
          const tags = [['title', itemTitle], ['artist', author.name], ['album', title], ['track', number]];

          const command = FFmpeg(stream, {}).audioBitrate(128);

          tags.forEach(([key, value]) => {
            command.addOption('-metadata', `${key}=${value}`);
          });

          const file = path.join(dir, `${number} - ${itemTitle}.mp3`);
          command.save(file).on('progress', (p) => {}).on('end', () => {
            downloads.get(dlId).then((doc) => {
              downloads.put({...doc, progress: (++done) / arr.length});
            });
            mainStory.info('store', `Finished downloading '${file}'`);
            resolve();
          }).on('error', (attach) => {
            mainStory.error('store', `An error occured for ${file}`, {attach});
          });
        });
      }
    });

    await fns.reduce((acc, fn) => {
      return acc.then(fn);
    }, Promise.resolve());

    const scanner = new Scanner(doc._id);
    return scanner.scan(PouchDB, dirname);
  }

  fetchResult (id: string) {
    this._fetchResult(id).catch((err) => console.log(err));
  }
}