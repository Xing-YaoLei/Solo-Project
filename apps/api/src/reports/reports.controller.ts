import { Controller, Get, Query, UseGuards, Post, Req } from '@nestjs/common'
import { ReportsService } from './reports.service'
import { JwtAuthGuard } from '../auth/jwt-auth.guard'
import { UserRole } from '@rental/db'

@Controller('reports')
@UseGuards(JwtAuthGuard)
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  private resolveRole(req: any, viewRole?: string): UserRole {
    const jwtRole = req?.user?.role as UserRole
    if (jwtRole === UserRole.ADMIN && viewRole && Object.values(UserRole).includes(viewRole as UserRole)) {
      return viewRole as UserRole
    }
    return jwtRole
  }

  @Get('dashboard')
  async getDashboardSummary(@Req() req: any, @Query('viewRole') viewRole?: string) {
    return this.reportsService.getDashboardSummary(req.user?.userId, this.resolveRole(req, viewRole))
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
    @Query('viewRole') viewRole?: string,
    @Req() req?: any,
  ) {
    return this.reportsService.getOccupancyReport({
      periodType,
      startDate,
      endDate,
      district,
      managerId,
      userId: req?.user?.userId,
      userRole: this.resolveRole(req, viewRole),
    })
  }

  @Get('tasks')
  async getTaskReport(
    @Query('periodType') periodType?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('type') type?: string,
    @Query('assigneeId') assigneeId?: string,
    @Query('viewRole') viewRole?: string,
    @Req() req?: any,
  ) {
    return this.reportsService.getTaskReport({
      periodType,
      startDate,
      endDate,
      type,
      assigneeId,
      userId: req?.user?.userId,
      userRole: this.resolveRole(req, viewRole),
    })
  }

  @Get('revenue')
  async getRevenueReport(
    @Query('periodType') periodType?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('propertyId') propertyId?: string,
    @Query('tenantId') tenantId?: string,
    @Query('viewRole') viewRole?: string,
    @Req() req?: any,
  ) {
    return this.reportsService.getRevenueReport({
      periodType,
      startDate,
      endDate,
      propertyId,
      tenantId,
      userId: req?.user?.userId,
      userRole: this.resolveRole(req, viewRole),
    })
  }

  @Get('maintenance')
  async getMaintenanceReport(
    @Query('periodType') periodType?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('workerId') workerId?: string,
    @Query('type') type?: string,
    @Query('viewRole') viewRole?: string,
    @Req() req?: any,
  ) {
    return this.reportsService.getMaintenanceReport({
      periodType,
      startDate,
      endDate,
      workerId,
      type,
      userId: req?.user?.userId,
      userRole: this.resolveRole(req, viewRole),
    })
  }
}
