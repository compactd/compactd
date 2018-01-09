export default abstract class AudioSource {
  abstract isPrefetched (): boolean;
  /**
   * Prefetches the source before playing
   */
  abstract prefetch (): Promise<void>;

  /**
   * Fetches the source and returns a string
   */
  abstract fetch (): Promise<string>;

  abstract getTrack (): string;
}