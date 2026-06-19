import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ReportsService } from './reports.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import { UserRole } from '@prisma/client';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';

@ApiTags('报表分析')
@ApiBearerAuth()
@Controller('reports')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Get('occupancy-trend')
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @ApiOperation({ summary: '入住率趋势' })
  getOccupancyTrend(
    @Query('propertyId') propertyId?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('period') period?: 'day' | 'week' | 'month',
  ) {
    const today = new Date();
    const defaultStart = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);

    return this.reportsService.getOccupancyTrend({
      propertyId: propertyId ? parseInt(propertyId) : undefined,
      startDate: startDate || defaultStart.toISOString().split('T')[0],
      endDate: endDate || today.toISOString().split('T')[0],
      period,
    });
  }

  @Get('revenue')
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @ApiOperation({ summary: '收入报表' })
  getRevenueReport(
    @Query('propertyId') propertyId?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    const today = new Date();
    const defaultStart = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);

    return this.reportsService.getRevenueReport({
      propertyId: propertyId ? parseInt(propertyId) : undefined,
      startDate: startDate || defaultStart.toISOString().split('T')[0],
      endDate: endDate || today.toISOString().split('T')[0],
    });
  }

  @Get('channel-distribution')
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @ApiOperation({ summary: '渠道分布' })
  getChannelDistribution(
    @Query('propertyId') propertyId?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.reportsService.getChannelDistribution({
      propertyId: propertyId ? parseInt(propertyId) : undefined,
      startDate,
      endDate,
    });
  }

  @Get('room-type-performance')
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @ApiOperation({ summary: '房型表现' })
  getRoomTypePerformance(
    @Query('propertyId') propertyId: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.reportsService.getRoomTypePerformance({
      propertyId: parseInt(propertyId),
      startDate,
      endDate,
    });
  }
}
