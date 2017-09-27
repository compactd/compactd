import PouchDB from '../../database';
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
  }).filter((key, index) => index < limit);
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
  await reports.put(ddoc as any);
}