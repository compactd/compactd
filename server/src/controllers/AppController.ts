import { Controller, Get } from '@nestjs/common';
import AppService from '@services/AppService';

@Controller('api')
export default class AppController {
  constructor(private readonly appService: AppService) {}
  @Get('status')
  getStatus() {
    return {
      version: this.appService.getVersion()
    };
  }
}
