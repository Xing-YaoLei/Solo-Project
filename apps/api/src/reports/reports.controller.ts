import { Controller, Get, Query, UseGuards, Post, Req } from '@nestjs/common'
import { ReportsService } from './reports.service'
import { JwtAuthGuard } from '../auth/jwt-auth.guard'
import { UserRole } from '@rental/db'

@Controller('reports')
@UseGuards(JwtAuthGuard)
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  private resolveRole(req: any, viewRole?: string): { role: UserRole; isViewSwitch: boolean } {
    const jwtRole = req?.user?.role as UserRole
    if (jwtRole === UserRole.ADMIN && viewRole && Object.values(UserRole).includes(viewRole as UserRole)) {
      return { role: viewRole as UserRole, isViewSwitch: true }
    }
    return { role: jwtRole, isViewSwitch: false }
  }

  @Get('dashboard')
  async getDashboardSummary(@Req() req: any, @Query('viewRole') viewRole?: string) {
    const { role, isViewSwitch } = this.resolveRole(req, viewRole)
    return this.reportsService.getDashboardSummary(isViewSwitch ? undefined : req.user?.userId, role)
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
    const { role, isViewSwitch } = this.resolveRole(req, viewRole)
    return this.reportsService.getOccupancyReport({
      periodType,
      startDate,
      endDate,
      district,
      managerId,
      userId: isViewSwitch ? undefined : req?.user?.userId,
      userRole: role,
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
    const { role, isViewSwitch } = this.resolveRole(req, viewRole)
    return this.reportsService.getTaskReport({
      periodType,
      startDate,
      endDate,
      type,
      assigneeId,
      userId: isViewSwitch ? undefined : req?.user?.userId,
      userRole: role,
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
    const { role, isViewSwitch } = this.resolveRole(req, viewRole)
    return this.reportsService.getRevenueReport({
      periodType,
      startDate,
      endDate,
      propertyId,
      tenantId,
      userId: isViewSwitch ? undefined : req?.user?.userId,
      userRole: role,
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
    const { role, isViewSwitch } = this.resolveRole(req, viewRole)
    return this.reportsService.getMaintenanceReport({
      periodType,
      startDate,
      endDate,
      workerId,
      type,
      userId: isViewSwitch ? undefined : req?.user?.userId,
      userRole: role,
    })
  }
}
