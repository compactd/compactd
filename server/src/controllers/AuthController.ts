import { Body, Controller, Get, Post } from '@nestjs/common';
import AuthService from '@services/AuthService';

@Controller()
export default class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('sessions')
  public async createSession(@Body() { username, password }) {
    return {
      token: await this.authService.createToken(username, password)
    };
  }

  @Post('users')
  public async createUser(@Body() { username, password }) {
    return {
      user: await this.authService.createUser(username, password)
    };
  }
}
