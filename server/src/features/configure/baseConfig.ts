export interface IConfig {
  key: string;
  value: any;
}

export const baseConfig: IConfig[] = [
  {
    key: 'playback.type',
    value: 'transcode'
  }, {
    key: 'dbconfiguration.finished',
    value: 'value'
  }, {
    key: 'transcoder.format',
    value: 'mp3'
  }, {
    key: 'transcoder.quality',
    value: 0
  }, {
    key: 'transcoder.chunkSize',
    value: 10
  }, {
    key: 'transcoder.fadeInOutDuration',
    value: 0
  }, {
    key: 'player.frontGap',
    value: 0
  }, {
    key: 'player.backGap',
    value: 0
  }, {
    key: 'statistician.enable',
    value: false
  }, {
    key: 'statistician.collect',
    value: false
  }, {
    key: 'statistician.suggestions.enable',
    value: false
  }, {
    key: 'statistician.suggestion.rediscover',
    value: false
  }, {
    key: 'configured',
    value: false
  }]
