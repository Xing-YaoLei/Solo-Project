import { Controller, Get, Post, Query, ParseIntPipe, Res, Body } from '@nestjs/common';
import { ExportService } from './export.service';
import { Response } from 'express';

@Controller('exports')
export class ExportController {
  constructor(private readonly exportService: ExportService) {}

  @Get()
  getExportRecords(
    @Query('exportType') exportType?: string,
    @Query('operatorId') operatorId?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('page', ParseIntPipe) page?: number,
    @Query('pageSize', ParseIntPipe) pageSize?: number,
  ) {
    return this.exportService.getExportRecords({
      exportType,
      operatorId: operatorId ? parseInt(operatorId) : undefined,
      startDate: startDate ? new Date(startDate) : undefined,
      endDate: endDate ? new Date(endDate) : undefined,
      page,
      pageSize,
    });
  }

  @Post('verifications')
  async exportVerifications(
    @Body() data: { scheduleId?: number; startDate?: string; endDate?: string; operatorId: number },
    @Res() res: Response,
  ) {
    const result = await this.exportService.exportVerificationData({
      scheduleId: data.scheduleId,
      startDate: data.startDate ? new Date(data.startDate) : undefined,
      endDate: data.endDate ? new Date(data.endDate) : undefined,
      operatorId: data.operatorId,
    });

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(result.filename)}"`);
    res.send(result.buffer);
  }

  @Post('sponsors')
  async exportSponsors(
    @Body() data: { scheduleId?: number; level?: string; operatorId: number },
    @Res() res: Response,
  ) {
    const result = await this.exportService.exportSponsorData({
      scheduleId: data.scheduleId,
      level: data.level,
      operatorId: data.operatorId,
    });

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(result.filename)}"`);
    res.send(result.buffer);
  }

  @Post('review')
  async exportReview(
    @Body() data: { year: number; month: number; operatorId: number },
    @Res() res: Response,
  ) {
    const result = await this.exportService.exportReviewData({
      year: data.year,
      month: data.month,
      operatorId: data.operatorId,
    });

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(result.filename)}"`);
    res.send(result.buffer);
  }
}
