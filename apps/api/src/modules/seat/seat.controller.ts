import { Controller, Get, Post, Put, Param, Body, Query } from '@nestjs/common';
import { SeatService } from './seat.service';

@Controller('seats')
export class SeatController {
  constructor(private readonly service: SeatService) {}

  @Get('maps')
  listMaps(@Query('activityId') activityId?: string) {
    return this.service.listMaps(activityId);
  }

  @Get('maps/:id')
  getMapDetail(@Param('id') id: string) {
    return this.service.getMapDetail(id);
  }

  @Get('maps/:id/stats')
  getSeatStats(@Param('id') id: string) {
    return this.service.getSeatStats(id);
  }

  @Post('maps')
  createMap(@Body() data: any) {
    return this.service.createMap(data);
  }

  @Put(':id/lock')
  lockSeat(@Param('id') id: string, @Body() data: { lockedBy: string }) {
    return this.service.lockSeat(id, data.lockedBy);
  }

  @Put(':id/release')
  releaseSeat(@Param('id') id: string) {
    return this.service.releaseSeat(id);
  }

  @Put(':id/status')
  updateStatus(@Param('id') id: string, @Body() data: { status: string }) {
    return this.service.updateSeatStatus(id, data.status);
  }
}
