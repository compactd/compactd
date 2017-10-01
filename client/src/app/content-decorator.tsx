
import {Artist, Album, Track, artistURI, albumURI} from 'compactd-models';
import PouchDB from 'pouchdb';

interface ResolveTrackAction {
  track: Track
}
interface ResolveAlbumAction {
  album: Album
}
interface ResolveArtistAction {
  artist: Artist;
}
interface MusicContentActionBase {
  type: string;
}

export type MusicContentAction = MusicContentActionBase
  & Partial<(ResolveAlbumAction & ResolveArtistAction & ResolveTrackAction)>;

export interface ActionCreators {
  /**
   * fetches an artist and add it to the store `artistsById`
   * @param slug the slug or _id of the artist
   */
  fetchDatabaseArtist: (slug: string) => void;
  /**
   * fetches an album and it to the store `albumsById`
   * @param id the _id of the album
   */
  fetchDatabaseAlbum: (id: string) => void;
  /**
   * fetches a track and add it to the store `tracksById`
   * @param id the track id to fetch
   */
  fetchDatabaseTrack: (id: string) => void;
}

export interface MusicContentState {
  artistsById: {[id: string]: Artist & any};
  albumsById: {[id: string]: Album & any};
  tracksById: {[id: string]: Track & any}
}

type Diff<T extends string, U extends string> = ({[P in T]: P } & {[P in U]: never } & { [x: string]: never })[T];  
type Omit<T, K extends keyof T> = {[P in Diff<keyof T, K>]: T[P]};  

/**
 * This class augments a reducer/action couple by allowing it to fetch 
 * albums and artists and tracks and save it to the store
 */
export default class MusicContentDecorator<T extends MusicContentState> {
  protected feature: string;
  constructor(feature: string) {
    this.feature = feature;
  }
  public initialState (state: Omit<T, 'albumsById' | 'artistsById' | 'tracksById'>): T {
    return Object.assign({}, state, {
      albumsById: {},
      artistsById: {},
      tracksById: {}
    }) as any;
  }
  protected get RESOLVE_ARTIST () {
    return `compactd/${this.feature}/music-content/RESOLVE_ARTIST`;
  }
  protected get RESOLVE_ALBUM () {
    return `compactd/${this.feature}/music-content/RESOLVE_ALBUM`;
  }
  protected get RESOLVE_TRACK () {
    return `compactd/${this.feature}/music-content/RESOLVE_TRACK`;
  }
  protected async fetchArtist (slug: string): Promise<MusicContentAction> {
    if (slug.startsWith('library/')) {
      return await this.fetchArtist(artistURI(slug).name);
    }
    const Artist = new PouchDB<Artist>('artists');

    const artist = await Artist.get(artistURI({name: slug}));
    
    return {
      type: this.RESOLVE_ARTIST,
      artist
    }
  }
  protected async fetchAlbum (id: string): Promise<MusicContentAction> {
    const Album = new PouchDB<Album>('albums');

    const album = await Album.get(id);
    
    return {
      type: this.RESOLVE_ALBUM,
      album
    }
  }
  protected async fetchTrack (id: string): Promise<MusicContentAction> {
    const Track = new PouchDB<Track>('tracks');

    const track = await Track.get(id);
    
    return {
      type: this.RESOLVE_ALBUM,
      track
    }
  }
  /**
   * returns the action creators 
   */
  public getActionCreators (): ActionCreators {
    return {
      fetchDatabaseAlbum: this.fetchAlbum.bind(this),
      fetchDatabaseArtist: this.fetchArtist.bind(this),
      fetchDatabaseTrack: this.fetchTrack.bind(this)
    }
  }
  /**
   * assigns action creators to an object
   * @param actions the actions to add mcs actions to
   */
  public addActionsCreators (actions: any) {
    return Object.assign({}, actions, this.getActionCreators());
  }
  protected reduceTrack (state: T, action: MusicContentAction): T {
    return Object.assign({}, state, {
      tracksById: Object.assign({}, state.tracksById, {
        [action.track._id]: action.track
      })
    });
  }
  protected reduceArtist (state: T, action: MusicContentAction): T {
    return Object.assign({}, state, {
      artistsById: {...state.artistsById,
        [action.artist._id]: action.artist
      }
    });
  }
  protected reduceAlbum (state: T, action: MusicContentAction): T {
    return Object.assign({}, state, {
      albumsById: {...state.albumsById,
        [action.album._id]: action.album
      }
    });
  }
  public reduce (state: T, action: MusicContentAction): T {
    switch (action.type) {
      case this.RESOLVE_TRACK:
        return this.reduceTrack(state, action);
      case this.RESOLVE_ARTIST:
        return this.reduceArtist(state, action);
      case this.RESOLVE_ALBUM:
        return this.reduceAlbum(state, action);
    }
    return state;
  }
  public createReducer<K> (initialState: T, reduce: (state: T, action: any) => T): (state: T, action: K) => T {
    return (state = initialState, action: any): T => {
      return this.reduce(reduce(state, action), action);
    }
  }
}