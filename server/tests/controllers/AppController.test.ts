import AppController from '@controllers/AppController';
import { Test } from '@nestjs/testing';
import AppService from '@services/AppService';

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

      expect(appController.getStatus()).toEqual({ version: 'foobar' });
    });
  });
});
