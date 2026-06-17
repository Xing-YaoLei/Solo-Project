import { Controller, Post, Body, Get, UseGuards, Req } from '@nestjs/common'
import { AuthService } from './auth.service'
import { JwtAuthGuard } from './jwt-auth.guard'

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  async login(@Body() loginDto: { email: string; password: string }) {
    return this.authService.login(loginDto.email, loginDto.password)
  }

  @Get('profile')
  @UseGuards(JwtAuthGuard)
  async getProfile(@Req() req: any) {
    return this.authService.getCurrentUser(req.user.userId)
  }

  @Post('logout')
  @UseGuards(JwtAuthGuard)
  async logout() {
    return { message: '退出登录成功' }
  }
}
