import { Controller, Get, Post, Body, Param, Query, ParseIntPipe } from '@nestjs/common';
import { SystemLogService } from './system-log.service';
import { LogAction } from '@prisma/client';

@Controller('system-logs')
export class SystemLogController {
  constructor(private readonly systemLogService: SystemLogService) {}

  @Get()
  findAll(
    @Query('module') module?: string,
    @Query('action') action?: LogAction,
    @Query('operatorId') operatorId?: string,
    @Query('relatedId') relatedId?: string,
    @Query('relatedType') relatedType?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('page', ParseIntPipe) page?: number,
    @Query('pageSize', ParseIntPipe) pageSize?: number,
  ) {
    return this.systemLogService.findAll({
      module,
      action,
      operatorId: operatorId ? parseInt(operatorId) : undefined,
      relatedId: relatedId ? parseInt(relatedId) : undefined,
      relatedType,
      startDate: startDate ? new Date(startDate) : undefined,
      endDate: endDate ? new Date(endDate) : undefined,
      page,
      pageSize,
    });
  }

  @Get('related/:relatedType/:relatedId')
  findByRelated(
    @Param('relatedType') relatedType: string,
    @Param('relatedId', ParseIntPipe) relatedId: number,
  ) {
    return this.systemLogService.findByRelated(relatedId, relatedType);
  }

  @Post()
  create(@Body() data: any) {
    return this.systemLogService.create(data);
  }
}
