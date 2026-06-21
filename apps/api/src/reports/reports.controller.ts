import { Controller, Get, Query, UseGuards, Req } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ReportsService } from './reports.service';
import { MonthlyReportQueryDto } from './dto/reports.dto';

@Controller('reports')
@UseGuards(AuthGuard('jwt'))
export class ReportsController {
  constructor(private reportsService: ReportsService) {}

  @Get('monthly')
  getMonthlyReport(@Req() req: any, @Query() query: MonthlyReportQueryDto) {
    return this.reportsService.getMonthlyReport(req.user.userId, query);
  }
}
