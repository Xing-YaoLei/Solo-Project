import { Controller, Get, Post, Put, Param, Body, Query } from '@nestjs/common';
import { ExceptionService, CreateExceptionInput } from './exception.service';

@Controller('exceptions')
export class ExceptionController {
  constructor(private readonly service: ExceptionService) {}

  @Get()
  list(
    @Query('activityId') activityId?: string,
    @Query('status') status?: string,
    @Query('type') type?: string,
    @Query('keyword') keyword?: string,
    @Query('page') page = '1',
    @Query('pageSize') pageSize = '20',
  ) {
    return this.service.list({
      activityId,
      status,
      type,
      keyword,
      page: parseInt(page, 10),
      pageSize: parseInt(pageSize, 10),
    });
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @Post()
  create(@Body() data: CreateExceptionInput) {
    return this.service.create(data);
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() data: any) {
    return this.service.update(id, data);
  }

  @Put(':id/status')
  updateStatus(
    @Param('id') id: string,
    @Body() data: { status: string; resolution?: string; handlingResult?: string; resolutionDetail?: any },
  ) {
    return this.service.updateStatus(id, data.status, data.resolution, data.handlingResult, data.resolutionDetail);
  }

  @Put(':id/liability')
  updateLiability(
    @Param('id') id: string,
    @Body() data: { liabilityParty: string; liabilityDetail?: string },
  ) {
    return this.service.updateLiability(id, data.liabilityParty, data.liabilityDetail);
  }

  @Put(':id/assign')
  assign(@Param('id') id: string, @Body() data: { handlerId: string; handlerName: string }) {
    return this.service.assign(id, data.handlerId, data.handlerName);
  }
}
