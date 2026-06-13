import { Controller, Get, Query } from '@nestjs/common';
import { TimelineService } from './timeline.service';

@Controller('timeline')
export class TimelineController {
  constructor(private readonly timelineService: TimelineService) {}

  @Get()
  async findAll(
    @Query('action') action?: string,
    @Query('operatorId') operatorId?: string,
    @Query('refundOrderId') refundOrderId?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('keyword') keyword?: string,
    @Query('page') page = '1',
    @Query('pageSize') pageSize = '20',
  ) {
    return this.timelineService.findAll({
      action: action as any,
      operatorId,
      refundOrderId,
      startDate: startDate ? new Date(startDate) : undefined,
      endDate: endDate ? new Date(endDate) : undefined,
      keyword,
      page: parseInt(page),
      pageSize: parseInt(pageSize),
    });
  }
}
