import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { DashboardService } from './dashboard.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@UseGuards(JwtAuthGuard)
@Controller('dashboard')
export class DashboardController {
  constructor(private dashboardService: DashboardService) {}

  @Get('stats')
  async getStats() {
    return this.dashboardService.getStats();
  }

  @Get('trend')
  async getTrend(@Query('days') days?: string) {
    const parsedDays = days ? parseInt(days, 10) : 30;
    return this.dashboardService.getTrend(parsedDays);
  }
}
