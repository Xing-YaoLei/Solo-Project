import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { ReportsService } from './reports.service';
import { JwtAuthGuard } from '../common/auth/jwt-auth.guard';

@ApiTags('报表统计')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('reports')
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Get('close-duration')
  @ApiOperation({ summary: '工单关闭时长统计' })
  getCloseDuration(
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.reportsService.getCloseDuration(startDate, endDate);
  }

  @Get('date-trend')
  @ApiOperation({ summary: '按日期趋势统计' })
  getDateTrend(
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.reportsService.getDateTrend(startDate, endDate);
  }

  @Get('owner-drill')
  @ApiOperation({ summary: '处理人钻取统计' })
  getOwnerDrill(
    @Query('departmentId') departmentId?: string,
  ) {
    return this.reportsService.getOwnerDrill(departmentId);
  }

  @Get('export')
  @ApiOperation({ summary: '导出报表数据' })
  export(
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.reportsService.export(startDate, endDate);
  }
}
