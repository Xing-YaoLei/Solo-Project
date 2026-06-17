import { Controller, Get, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { DashboardService } from './dashboard.service';

@ApiTags('dashboard')
@Controller('dashboard')
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get('trends')
  @ApiOperation({ summary: 'Get care compliance trend data' })
  @ApiQuery({ name: 'period', enum: ['week', 'month'] })
  getTrends(@Query('period') period: 'week' | 'month' = 'week') {
    return this.dashboardService.getTrends(period);
  }

  @Get('alerts')
  @ApiOperation({ summary: 'Get alerts for declining compliance and high-risk elders' })
  getAlerts() {
    return this.dashboardService.getAlerts();
  }
}
