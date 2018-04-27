import AppController from '@controllers/AppController';
import AppService from '@services/AppService';

import { Test } from '@nestjs/testing';

describe('AppController', () => {
  let appController: AppController;
  let appService: AppService;

  beforeEach(async () => {
    appService = new AppService();
    appController = new AppController(appService);
  });

  describe('getStatus', () => {
    it('should return a status object', async () => {
      jest.spyOn(appService, 'getVersion').mockImplementation(() => 'foobar');

      expect(appController.getStatus(null)).toEqual({
        user: null,
        version: 'foobar'
      });
    });
  });
});
