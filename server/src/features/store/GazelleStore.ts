import TrackerStore from "./TrackerStore";
import ResultEntry from "./ResultEntry";
import { GazelleIndexer } from "../cascade/GazelleIndexer";
import { getPassword } from "../cascade/trackers";
import { EventEmitter } from "events";
import HashMap from "../../helpers/HashMap";
import { StoreOptionSchemaEntry } from "./StoreOptionsSchema";
import { join } from "path";

const IP_ADRESS_REGEX = /^(([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5])\.){3}([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5])$/;
const DOMAIN_REGEX    = /^(([a-zA-Z0-9]|[a-zA-Z0-9][a-zA-Z0-9\-]*[a-zA-Z0-9])\.)*([A-Za-z0-9]|[A-Za-z0-9][A-Za-z0-9\-]*[A-Za-z0-9])$/;

export const optsSchema = [{
  keyName: 'username',
  descriptin: 'Username used to login on tracker'
}, {
  keyName: 'host',
  description: 'Hostname of tracker',
  validator: (val: string) => {
    if (IP_ADRESS_REGEX.test(val) || DOMAIN_REGEX.test(val)) {
      return;
    }

    throw new Error('Host does not match regex');
  }
}];

export default class GazelleStore extends TrackerStore {
  public name = 'gazelle';
  protected indexer: GazelleIndexer;

  public constructor (opts: HashMap<string>, id: string) {
    super(optsSchema, opts, id);
  }

  async authenticate () {
    await super.authenticate();

    this.indexer = new GazelleIndexer({
      hostname: this.opts.host,
      username: this.opts.username,
      tracker: 'gazelle'
    });

    await this.indexer.login(await getPassword(this._id));
  }

  async search(artist: string, album: string): Promise<ResultEntry[]> {
    const res = await this.indexer.searchAlbum({name: album, artist} as any);

    return res.map(({
        _id, tracker, seeders, leechers, torrent_id, bitrate, name, wanted, format
    }) => ({
      _id: join('results', artist, album, torrent_id),
      store: this._id,
      name, format, sid: torrent_id, stats: [{
        name: 'Seeders',
        icon: 'caret-up',
        value: `${seeders}`,
        desc: 'Number of seeders'
      },{
        name: 'Leechers',
        icon: 'caret-down',
        value: `${leechers}`,
        desc: 'Number of leechers'
      }]
    }));
  }

  fetchResult(id: string): EventEmitter {
    const eventEmitter = new EventEmitter();
    const [results, artist, album, sid] = id.split('/');

    this.indexer.downloadRelease(sid).then((buffer) => {
      return this.downloadFile(buffer, eventEmitter, id);
    }).catch((err) => {
      eventEmitter.emit('error', err);
    });

    return eventEmitter;
  }
  
}