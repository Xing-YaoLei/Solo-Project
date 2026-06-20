import { Controller, Get, Post, Put, Param, Body, Query } from '@nestjs/common';
import { OrderService } from './order.service';

@Controller('orders')
export class OrderController {
  constructor(private readonly service: OrderService) {}

  @Get()
  list(
    @Query('activityId') activityId?: string,
    @Query('status') status?: string,
    @Query('keyword') keyword?: string,
    @Query('page') page = '1',
    @Query('pageSize') pageSize = '20',
  ) {
    return this.service.list({
      activityId,
      status,
      keyword,
      page: parseInt(page, 10),
      pageSize: parseInt(pageSize, 10),
    });
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @Get(':id/history')
  listHistory(@Param('id') id: string) {
    return this.service.listHistory(id);
  }

  @Post()
  create(@Body() data: any) {
    return this.service.create(data);
  }

  @Post(':id/pay')
  pay(@Param('id') id: string, @Body() data: { paymentMethod: string; operatorId?: string }) {
    return this.service.pay(id, data.paymentMethod, data.operatorId);
  }

  @Put(':id/status')
  transition(
    @Param('id') id: string,
    @Body() data: { toStatus: string; reason?: string; note?: string; operatorId?: string },
  ) {
    return this.service.transition(id, data.toStatus, data.reason, data.note, data.operatorId);
  }
}
