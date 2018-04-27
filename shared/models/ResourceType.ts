enum ResourceTypes {
  /**
   * This is a primary audio file for a track
   * Any track must point to a resource with this type
   */
  AUDIO = 'audio',
  /**
   * Unused for now, could represent an audio clip,
   * for example downloaded from youtube official clip
   */
  AUDIO_CLIP = 'audio_clip',
  /**
   * An artwork image file
   */
  ARTWORK = 'artwork',
  /**
   * A metadata file, would be a format that describes id3 tags
   * or any metadata externally
   */
  METADATA = 'metadata',
  /**
   * File with known content, but ignored for various reason
   * (excluded, invalid format etc)
   */
  IGNORED = 'ignored',
  /**
   * A playlist file (.m3u)
   */
  PLAYLIST = 'playlist',
  /**
   * Any other file really
   */
  UNKNOWN = 'unknown'
}

export default ResourceTypes;
