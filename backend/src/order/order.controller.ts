import { Controller, Get, Post, Put, Delete, Body, Param, Query, ParseIntPipe } from '@nestjs/common';
import { OrderService } from './order.service';
import { OrderStatus } from '@prisma/client';

@Controller('orders')
export class OrderController {
  constructor(private readonly orderService: OrderService) {}

  @Get()
  findAll(
    @Query('scheduleId') scheduleId?: string,
    @Query('ticketTypeId') ticketTypeId?: string,
    @Query('status') status?: OrderStatus,
    @Query('buyerName') buyerName?: string,
    @Query('buyerPhone') buyerPhone?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('page', ParseIntPipe) page?: number,
    @Query('pageSize', ParseIntPipe) pageSize?: number,
  ) {
    return this.orderService.findAll({
      scheduleId: scheduleId ? parseInt(scheduleId) : undefined,
      ticketTypeId: ticketTypeId ? parseInt(ticketTypeId) : undefined,
      status,
      buyerName,
      buyerPhone,
      startDate: startDate ? new Date(startDate) : undefined,
      endDate: endDate ? new Date(endDate) : undefined,
      page,
      pageSize,
    });
  }

  @Get(':id')
  findById(@Param('id', ParseIntPipe) id: number) {
    return this.orderService.findById(id);
  }

  @Get(':id/change-logs')
  getChangeLogs(@Param('id', ParseIntPipe) id: number) {
    return this.orderService.getChangeLogs(id);
  }

  @Post()
  create(@Body() data: any) {
    return this.orderService.create(data);
  }

  @Put(':id')
  update(@Param('id', ParseIntPipe) id: number, @Body() data: any) {
    const { operatorId, ...rest } = data;
    return this.orderService.update(id, rest, operatorId ? parseInt(operatorId) : undefined);
  }

  @Put(':id/status')
  updateStatus(
    @Param('id', ParseIntPipe) id: number,
    @Body() data: { status: OrderStatus; operatorId?: number; remark?: string },
  ) {
    return this.orderService.updateStatus(id, data.status, data.operatorId, data.remark);
  }
}
