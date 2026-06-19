import {
  Controller,
  Get,
  Query,
  UseGuards,
} from '@nestjs/common';
import { StatisticsService } from './statistics.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Permissions } from '../auth/decorators/permissions.decorator';
import { RoleEnum } from '@prisma/client';

@UseGuards(JwtAuthGuard, RolesGuard, PermissionsGuard)
@Controller('statistics')
export class StatisticsController {
  constructor(private readonly statisticsService: StatisticsService) {}

  @Get('dashboard')
  @Roles(RoleEnum.MANAGER, RoleEnum.ADVISOR)
  @Permissions('statistics:read')
  getDashboardStats() {
    return this.statisticsService.getDashboardStats();
  }

  @Get('work-order-status-distribution')
  @Roles(RoleEnum.MANAGER, RoleEnum.ADVISOR)
  @Permissions('statistics:read')
  getWorkOrderStatusDistribution() {
    return this.statisticsService.getWorkOrderStatusDistribution();
  }

  @Get('rework-rate')
  @Roles(RoleEnum.MANAGER)
  @Permissions('statistics:read')
  getReworkRate(
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.statisticsService.getReworkRate(startDate, endDate);
  }

  @Get('rework-orders')
  @Roles(RoleEnum.MANAGER, RoleEnum.ADVISOR)
  @Permissions('statistics:read')
  getReworkOrders(
    @Query('page') page = 1,
    @Query('pageSize') pageSize = 10,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.statisticsService.getReworkOrders(+page, +pageSize, startDate, endDate);
  }

  @Get('technician-workload')
  @Roles(RoleEnum.MANAGER)
  @Permissions('statistics:read')
  getTechnicianWorkload(
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.statisticsService.getTechnicianWorkload(startDate, endDate);
  }

  @Get('service-items')
  @Roles(RoleEnum.MANAGER, RoleEnum.ADVISOR)
  @Permissions('statistics:read')
  getServiceItemStats(
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.statisticsService.getServiceItemStats(startDate, endDate);
  }

  @Get('revenue-trend')
  @Roles(RoleEnum.MANAGER)
  @Permissions('statistics:read')
  getRevenueTrend(
    @Query('type') type = 'day',
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.statisticsService.getRevenueTrend(type, startDate, endDate);
  }

  @Get('part-usage')
  @Roles(RoleEnum.MANAGER, RoleEnum.PARTS_CLERK)
  @Permissions('statistics:read')
  getPartUsageStats(
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.statisticsService.getPartUsageStats(startDate, endDate);
  }
}
