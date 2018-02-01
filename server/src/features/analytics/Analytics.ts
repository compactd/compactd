import PouchDB from '../../database';
import { Track } from 'compactd-models';
const docuri = require('docuri');


export const Route = docuri.route('reports/:type/:ts');

export type ReportType = 'listen' | 'skip';

export interface Report {
  type: ReportType,
  ts: number,
  track: string,
  _id?: string
}

const reports = new PouchDB<Report>('reports');


export async function report (type: ReportType, track: string) {
  const ts = Date.now();
  const doc = await reports.put({
    track: track, type, ts, _id: Route({type, ts})
  });
  return doc;
}

export async function getTopTracks (limit = 10) {
  const res = await reports.query('analytics/by_track', {
    group: true,
    reduce: true
  });
  return res.rows.sort((a, b) => {
    return b.value - a.value;
  }).filter((key, index) => limit && index < limit);
}

export async function getFavedTracks (limit = 10) {
  const res = await new PouchDB('tracks').query('fav/only_favs', {});
  const top = await getTopTracks(420);
  return res.rows.sort((a, b) => {
    const ar = top.find((el) => el.id === a) || {value: 0};
    const br = top.find((el) => el.id === b) || {value: 0};
    if (ar.value > b.value) return 1;
    if (ar.value < b.value) return -1;
    return 0;
  });
}

// This is just to pass
const emit: any = null;

export async function initialize () {
  const ddoc = {
    _id: '_design/analytics',
    views: {
      by_track: {
        reduce: '_count',
        map: function (doc: Report) {
          emit(doc.track, doc.ts);
        }.toString()
      }
    }
  };
  const tdoc = {
    _id: '_design/fav',
    views: {
      only_favs: {
        map: function (doc: Track) {
          if (doc.fav) {
            emit(doc.fav);
          }
        }.toString()  
      }
    }
  };
  try {
    await new PouchDB('tracks').put(tdoc as any);
  } catch (err) {}
  try {
    await reports.put(ddoc as any);
  } catch (err) {}
}