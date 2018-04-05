import AppService from '@services/AppService';

const { version } = require('../../../package.json');

describe('AppService', () => {
  let appService: AppService;
  beforeEach(() => {
    appService = new AppService();
  });

  describe('getVersion', () => {
    it('should return current version', () => {
      expect(appService.getVersion()).toBe(version);
    });
  });
});
