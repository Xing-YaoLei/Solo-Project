import { Controller, Get, Post, Query, Body, Res } from '@nestjs/common';
import { ReportsService } from './reports.service';
import { CleaningTaskStatus } from '@prisma/client';
import { Response } from 'express';

@Controller('api/reports')
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Get('monthly')
  getMonthlyReport(
    @Query('year') year: string,
    @Query('month') month: string,
  ) {
    return this.reportsService.getMonthlyReport(
      parseInt(year, 10),
      parseInt(month, 10),
    );
  }

  @Get('punctuality-rate')
  getPunctualityRate(
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
  ) {
    return this.reportsService.getPunctualityRate(
      new Date(startDate),
      new Date(endDate),
    );
  }

  @Post('export/monthly')
  async exportMonthlyReport(
    @Body() data: {
      year: number;
      month: number;
      filters?: {
        propertyId?: string;
        assignedToId?: string;
        status?: CleaningTaskStatus;
      };
      operatorId: string;
      operatorName: string;
    },
    @Res() res: Response,
  ) {
    const report = await this.reportsService.exportMonthlyReport(
      data.year,
      data.month,
      data.filters || {},
      data.operatorId,
      data.operatorName,
    );

    const filename = `保洁月报_${data.year}年${data.month}月_${new Date().toISOString().slice(0, 10)}.json`;
    
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(JSON.stringify(report, null, 2));
  }
}
