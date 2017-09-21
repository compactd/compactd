import * as mkdirp from 'mkdirp';
import scgi from './scgi';
import {mainStory} from 'storyboard';
import * as path from 'path';
import config from '../../config';
import * as parseTorrent from 'parse-torrent';
import * as assert from 'assert';

interface Options {
  scgiPort: string;
  scgiHost: string;
  targetPath: string;
}

const defaultOpts: Options = {
  scgiPort: config.get('scgiPort'),
  scgiHost: config.get('scgiHost'),
  targetPath: path.join(config.get('dataDirectory'), '/downloads')
};

export default class RTorrentItem {
  opts: Options;
  name: string;
  infoHash: string;

  constructor({ infoHash, name }: { infoHash: string, name: string }, opts: Partial<Options>) {
    this.infoHash = infoHash;
    this.name     = name;
    this.opts     = Object.assign({}, defaultOpts , opts);
  }

  getProgress () {

    return Promise.all([
      ['d.get_complete', [this.infoHash]],
      ['d.get_bytes_done', [this.infoHash]],
      ['d.get_size_bytes', [this.infoHash]]
    ].map(([name, params]) => {
      return scgi.methodCall(name as any, params as any,
        this.opts.scgiHost, +this.opts.scgiPort);
    })).then(([complete, done, size]) => {
      if (+complete === 1) {
        return Promise.resolve(1);
      }
      return Promise.resolve((+done) / (+size));
    });
  }

  static findTorrent(buffer: Buffer | string, parse = parseTorrent, opts = {}) {
    const {infoHash, name} = parse(buffer);

    assert(infoHash !== undefined);
    return new RTorrentItem({infoHash, name}, opts);
  }

  static async addTorrent(content: Buffer, options: Partial<Options> = {}) {
    const opts = Object.assign({}, defaultOpts, options);

    const parameters: (Buffer | string)[] = [''];

    parameters.push(content);
    parameters.push(`d.directory.set="${opts.targetPath}"`);

    try {
      await scgi.methodCall('load_raw_start', parameters,
        opts.scgiHost, +opts.scgiPort);
    } catch (err) {
      mainStory.error('scgi', 'Error while calling scgi', {attach: err});
      return Promise.reject(err);
    }

    return RTorrentItem.findTorrent(content, parseTorrent, opts);
  }
};

export type TorrentsCommands = 'd.add_peer' | 'd.check_hash'  | 'd.close'  | 'd.create_link'  | 'd.delete_link'  | 'd.delete_tied'  | 'd.erase'  | 'd.get_base_filename'  | 'd.get_base_path'  | 'd.get_bitfield'  | 'd.get_bytes_done'  | 'd.get_chunk_size'  | 'd.get_chunks_hashed'  | 'd.get_complete'  | 'd.get_completed_bytes'  | 'd.get_completed_chunks'  | 'd.get_connection_current'  | 'd.get_connection_leech'  | 'd.get_connection_seed'  | 'd.get_creation_date'  | 'd.get_custom1'  | 'd.get_custom2'  | 'd.get_custom3'  | 'd.get_custom4'  | 'd.get_custom5'  | 'd.get_custom_throw'  | 'd.get_directory'  | 'd.get_directory_base'  | 'd.get_down_rate'  | 'd.get_down_total'  | 'd.get_free_diskspace'  | 'd.get_hash'  | 'd.get_hashing'  | 'd.get_hashing_failed'  | 'd.get_ignore_commands'  | 'd.get_left_bytes'  | 'd.get_loaded_file'  | 'd.get_local_id'  | 'd.get_local_id_html'  | 'd.get_max_file_size'  | 'd.get_max_size_pex'  | 'd.get_message'  | 'd.get_mode'  | 'd.get_name'  | 'd.get_peer_exchange'  | 'd.get_peers_accounted'  | 'd.get_peers_complete'  | 'd.get_peers_connected'  | 'd.get_peers_max'  | 'd.get_peers_min'  | 'd.get_peers_not_connected'  | 'd.get_priority'  | 'd.get_priority_str'  | 'd.get_ratio'  | 'd.get_size_bytes'  | 'd.get_size_chunks'  | 'd.get_size_files'  | 'd.get_size_pex'  | 'd.get_skip_rate'  | 'd.get_skip_total'  | 'd.get_state'  | 'd.get_state_changed'  | 'd.get_state_counter'  | 'd.get_throttle_name'  | 'd.get_tied_to_file'  | 'd.get_tracker_focus'  | 'd.get_tracker_numwant'  | 'd.get_tracker_size'  | 'd.get_up_rate'  | 'd.get_up_total'  | 'd.get_uploads_max'  | 'd.initialize_logs'  | 'd.is_active'  | 'd.is_hash_checked'  | 'd.is_hash_checking'  | 'd.is_multi_file'  | 'd.is_open'  | 'd.is_pex_active'  | 'd.is_private'  | 'd.open'  | 'd.pause'  | 'd.resume'  | 'd.save_session'  | 'd.set_connection_current'  | 'd.set_custom1'  | 'd.set_custom2'  | 'd.set_custom3'  | 'd.set_custom4'  | 'd.set_custom5'  | 'd.set_directory'  | 'd.set_directory_base'  | 'd.set_hashing_failed'  | 'd.set_ignore_commands'  | 'd.set_max_file_size'  | 'd.set_message'  | 'd.set_peer_exchange'  | 'd.set_peers_max'  | 'd.set_peers_min'  | 'd.set_priority'  | 'd.set_throttle_name'  | 'd.set_tied_to_file'  | 'd.set_tracker_numwant'  | 'd.set_uploads_max'  | 'd.start'  | 'd.stop'  | 'd.try_close'  | 'd.try_start'  | 'd.try_stop'  | 'd.update_priorities'  | 'd.views'  | 'd.views'  | 'd.views'  | 'd.views'  | 'd.views';

export type FilesCommands = 'f.get_completed_chunks' | 'f.get_frozen_path' | 'f.get_last_touched' | 'f.get_match_depth_next' | 'f.get_match_depth_prev' | 'f.get_offset' | 'f.get_path' | 'f.get_path_components' | 'f.get_path_depth' | 'f.get_priority' | 'f.get_range_first' | 'f.get_range_second' | 'f.get_size_bytes' | 'f.get_size_chunks' | 'f.is_create_queued' | 'f.is_created' | 'f.is_open' | 'f.is_resize_queued' | 'f.set_create_queued' | 'f.set_priority' | 'f.set_resize_queued' | 'f.unset_create_queued' | 'f.unset_resize_queued'

export type PeersCommands = 'p.get_address' | 'p.get_client_version' | 'p.get_completed_percent' | 'p.get_down_rate' | 'p.get_down_total' | 'p.get_id' | 'p.get_id_html' | 'p.get_options_str' | 'p.get_peer_rate' | 'p.get_peer_total' | 'p.get_port' | 'p.get_up_rate' | 'p.get_up_total' | 'p.is_encrypted' | 'p.is_incoming' | 'p.is_obfuscated' | 'p.is_snubbed'

export type TrackersCommands = 't.get_group' | 't.get_id' | 't.get_min_interval' | 't.get_normal_interval' | 't.get_scrape_complete' | 't.get_scrape_downloaded' | 't.get_scrape_incomplete' | 't.get_scrape_time_last' | 't.get_type' | 't.get_url' | 't.is_enabled' | 't.is_open' | 't.set_enabled'

export type SystemCommands = 'system.listMethods' | 'system.methodSignature' | 'system.methodHelp' | 'system.multicall' | 'system.shutdown';

export type LoadCommands = 'load' | 'load_raw' | 'load_raw_start' | 'load_raw_verbose' | 'load_start' | 'load_start_verbose' | 'load_verbose';

export type Commands = TorrentsCommands | FilesCommands | PeersCommands | TrackersCommands | SystemCommands | LoadCommands;
