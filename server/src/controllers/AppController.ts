import { Controller, Get } from '@nestjs/common';
import AppService from '@services/AppService';
import { User } from '@utils/decorators';

@Controller()
export default class AppController {
  constructor(private readonly appService: AppService) {}
  @Get('status')
  public async getStatus(@User() user) {
    return {
      flags: {
        configured: await this.appService.isConfigured()
      },
      user,
      version: this.appService.getVersion()
    };
  }
}
