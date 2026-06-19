import { Controller, Get, Post, Put, Param, Body, Query } from '@nestjs/common';
import { SystemLogsService } from './system-logs.service';
import { LogAction } from '@prisma/client';

@Controller('api/system-logs')
export class SystemLogsController {
  constructor(private readonly systemLogsService: SystemLogsService) {}

  @Get()
  findAll(
    @Query('entityType') entityType?: string,
    @Query('entityId') entityId?: string,
    @Query('action') action?: LogAction,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('page') page?: string,
    @Query('pageSize') pageSize?: string,
  ) {
    return this.systemLogsService.findAll({
      entityType,
      entityId,
      action,
      startDate: startDate ? new Date(startDate) : undefined,
      endDate: endDate ? new Date(endDate) : undefined,
      page: page ? parseInt(page, 10) : undefined,
      pageSize: pageSize ? parseInt(pageSize, 10) : undefined,
    });
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.systemLogsService.findOne(id);
  }

  @Post()
  create(@Body() data: {
    entityType: string;
    entityId: string;
    action: LogAction;
    reason?: string;
    details?: string;
    createdById?: string;
  }) {
    return this.systemLogsService.create(data);
  }

  @Put(':id/close')
  closeLog(
    @Param('id') id: string,
    @Body() data: { closeReason: string; closedById?: string },
  ) {
    return this.systemLogsService.closeLog(id, data.closeReason, data.closedById);
  }
}
