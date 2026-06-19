import { Controller, Get } from '@nestjs/common';
import { AuthService } from './auth.service';

@Controller('api/auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Get('current-user')
  getCurrentUser() {
    return this.authService.getCurrentUser();
  }
}
