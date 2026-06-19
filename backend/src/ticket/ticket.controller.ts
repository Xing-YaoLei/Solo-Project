import { Controller, Get, Post, Put, Delete, Body, Param, Query, ParseIntPipe } from '@nestjs/common';
import { TicketService } from './ticket.service';

@Controller('ticket-types')
export class TicketController {
  constructor(private readonly ticketService: TicketService) {}

  @Get()
  findAll(
    @Query('scheduleId') scheduleId?: string,
    @Query('status') status?: string,
    @Query('page', ParseIntPipe) page?: number,
    @Query('pageSize', ParseIntPipe) pageSize?: number,
  ) {
    return this.ticketService.findAll({
      scheduleId: scheduleId ? parseInt(scheduleId) : undefined,
      status,
      page,
      pageSize,
    });
  }

  @Get('stats')
  getStats(@Query('scheduleId') scheduleId?: string) {
    return this.ticketService.getTicketStats(scheduleId ? parseInt(scheduleId) : undefined);
  }

  @Get(':id')
  findById(@Param('id', ParseIntPipe) id: number) {
    return this.ticketService.findById(id);
  }

  @Post()
  create(@Body() data: any) {
    const { operatorId, ...rest } = data;
    return this.ticketService.create(rest, operatorId ? parseInt(operatorId) : undefined);
  }

  @Put(':id')
  update(@Param('id', ParseIntPipe) id: number, @Body() data: any) {
    const { operatorId, ...rest } = data;
    return this.ticketService.update(id, rest, operatorId ? parseInt(operatorId) : undefined);
  }

  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number, @Query('operatorId') operatorId?: string) {
    return this.ticketService.remove(id, operatorId ? parseInt(operatorId) : undefined);
  }
}
