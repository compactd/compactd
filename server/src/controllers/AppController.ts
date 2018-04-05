import { Controller, Get } from '@nestjs/common';

const { version } = require('../../../package.json');

@Controller('api')
export default class AppController {
  @Get('status')
  getStatus() {
    return {
      version
    };
  }
}
