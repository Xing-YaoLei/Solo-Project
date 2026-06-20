import { Controller, Get, Post, Param, Body, Query } from '@nestjs/common';
import { CheckInService } from './check-in.service';

@Controller('check-in')
export class CheckInController {
  constructor(private readonly service: CheckInService) {}

  @Get()
  list(
    @Query('activityId') activityId?: string,
    @Query('orderId') orderId?: string,
    @Query('status') status?: string,
    @Query('keyword') keyword?: string,
    @Query('page') page = '1',
    @Query('pageSize') pageSize = '50',
  ) {
    return this.service.list({
      activityId,
      orderId,
      status,
      keyword,
      page: parseInt(page, 10),
      pageSize: parseInt(pageSize, 10),
    });
  }

  @Get(':code/verify')
  verify(@Param('code') code: string) {
    return this.service.verify(code);
  }

  @Post(':code/check-in')
  checkIn(@Param('code') code: string, @Body() data?: { operatorId?: string }) {
    return this.service.checkIn(code, data?.operatorId);
  }

  @Post(':code/check-out')
  checkOut(@Param('code') code: string) {
    return this.service.checkOut(code);
  }

  @Get('stats/by-activity')
  batchStats(@Query('activityId') activityId: string) {
    return this.service.batchStats(activityId);
  }
}
