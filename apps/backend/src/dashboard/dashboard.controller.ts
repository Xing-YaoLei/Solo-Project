import { Controller, Get, Query, UseGuards, Req } from '@nestjs/common';
import { DashboardService } from './dashboard.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';

@ApiTags('仪表盘')
@ApiBearerAuth()
@Controller('dashboard')
@UseGuards(JwtAuthGuard, RolesGuard)
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get('overview')
  @ApiOperation({ summary: '总览数据' })
  getOverview(@Req() req: any, @Query('propertyId') propertyId?: string) {
    return this.dashboardService.getOverview(
      req.user,
      propertyId ? parseInt(propertyId) : undefined,
    );
  }

  @Get('today-tasks')
  @ApiOperation({ summary: '今日任务' })
  getTodayTasks(@Req() req: any, @Query('propertyId') propertyId?: string) {
    return this.dashboardService.getTodayTasks(
      req.user,
      propertyId ? parseInt(propertyId) : undefined,
    );
  }

  @Get('quick-stats')
  @ApiOperation({ summary: '快速统计' })
  getQuickStats(@Req() req: any, @Query('propertyId') propertyId?: string) {
    return this.dashboardService.getQuickStats(
      req.user,
      propertyId ? parseInt(propertyId) : undefined,
    );
  }

  @Get('frontline')
  @ApiOperation({ summary: '一线人员仪表盘' })
  getFrontlineDashboard(@Req() req: any) {
    return this.dashboardService.getFrontlineDashboard(req.user.userId);
  }
}
