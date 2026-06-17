import { Controller, Get, Query, UseGuards, Post } from '@nestjs/common'
import { ReportsService } from './reports.service'
import { JwtAuthGuard } from '../auth/jwt-auth.guard'

@Controller('reports')
@UseGuards(JwtAuthGuard)
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Get('dashboard')
  async getDashboardSummary() {
    return this.reportsService.getDashboardSummary()
  }

  @Post('dashboard/refresh')
  async clearDashboardCache() {
    return this.reportsService.clearDashboardCache()
  }

  @Get('occupancy')
  async getOccupancyReport(
    @Query('periodType') periodType?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('district') district?: string,
    @Query('managerId') managerId?: string,
  ) {
    return this.reportsService.getOccupancyReport({
      periodType,
      startDate,
      endDate,
      district,
      managerId,
    })
  }

  @Get('tasks')
  async getTaskReport(
    @Query('periodType') periodType?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('type') type?: string,
    @Query('assigneeId') assigneeId?: string,
  ) {
    return this.reportsService.getTaskReport({
      periodType,
      startDate,
      endDate,
      type,
      assigneeId,
    })
  }

  @Get('revenue')
  async getRevenueReport(
    @Query('periodType') periodType?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('propertyId') propertyId?: string,
    @Query('tenantId') tenantId?: string,
  ) {
    return this.reportsService.getRevenueReport({
      periodType,
      startDate,
      endDate,
      propertyId,
      tenantId,
    })
  }

  @Get('maintenance')
  async getMaintenanceReport(
    @Query('periodType') periodType?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('workerId') workerId?: string,
    @Query('type') type?: string,
  ) {
    return this.reportsService.getMaintenanceReport({
      periodType,
      startDate,
      endDate,
      workerId,
      type,
    })
  }
}
