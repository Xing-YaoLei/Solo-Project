import { Controller, Get, Post, Put, Delete, Param, Body, Query } from '@nestjs/common';
import { SponsorService } from './sponsor.service';

@Controller('sponsors')
export class SponsorController {
  constructor(private readonly service: SponsorService) {}

  @Get()
  list(@Query('activityId') activityId?: string) {
    return this.service.list(activityId);
  }

  @Get('summary')
  summary(@Query('activityId') activityId: string) {
    return this.service.summaryByActivity(activityId);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
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
