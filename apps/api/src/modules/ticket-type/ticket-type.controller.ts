import { Controller, Get, Post, Put, Delete, Param, Body, Query } from '@nestjs/common';
import { TicketTypeService } from './ticket-type.service';

@Controller('ticket-types')
export class TicketTypeController {
  constructor(private readonly service: TicketTypeService) {}

  @Get()
  list(@Query('activityId') activityId?: string) {
    return this.service.list(activityId);
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

  @Put(':id')
  update(@Param('id') id: string, @Body() data: any) {
    return this.service.update(id, data);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.service.remove(id);
  }
}
