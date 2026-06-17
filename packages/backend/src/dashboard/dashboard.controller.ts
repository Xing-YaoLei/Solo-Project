import { Controller, Get, Query, UseGuards, Req } from '@nestjs/common';
import { DashboardService } from './dashboard.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard, Roles } from '../auth/roles.guard';

@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('dashboard')
export class DashboardController {
  constructor(private dashboardService: DashboardService) {}

  @Roles('ADMIN', 'MANAGER')
  @Get('stats')
  async getStats(@Req() req: any) {
    return this.dashboardService.getStats(req.user.id, req.user.role);
  }

  @Roles('ADMIN', 'MANAGER')
  @Get('trend')
  async getTrend(@Query('days') days?: string, @Req() req?: any) {
    const parsedDays = days ? parseInt(days, 10) : 30;
    return this.dashboardService.getTrend(parsedDays, req.user.id, req.user.role);
  }

  @Get('my-stats')
  async getMyStats(@Req() req: any) {
    return this.dashboardService.getPersonalStats(req.user.id);
  }
}
