import { Controller, Get } from '@nestjs/common';
import AppService from '@services/AppService';
import { User } from '@utils/decorators';

@Controller()
export default class AppController {
  constructor(private readonly appService: AppService) {}
  @Get('status')
  public getStatus(@User() user) {
    return {
      user,
      version: this.appService.getVersion()
    };
  }
}
