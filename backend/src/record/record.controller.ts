import { Controller, Get, Param, Query, ParseIntPipe } from '@nestjs/common';
import { RecordService } from './record.service';

@Controller('records')
export class RecordController {
  constructor(private readonly recordService: RecordService) {}

  @Get('schedule/:scheduleId')
  getRecordsBySchedule(@Param('scheduleId', ParseIntPipe) scheduleId: number) {
    return this.recordService.getRecordsBySchedule(scheduleId);
  }

  @Get('overview')
  getRecordOverview(
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.recordService.getRecordOverview({
      startDate: startDate ? new Date(startDate) : undefined,
      endDate: endDate ? new Date(endDate) : undefined,
    });
  }
}
