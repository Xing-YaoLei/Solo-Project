import { Controller, Get, Param, Query } from '@nestjs/common';
import { OperationLogService } from './operation-log.service';
import { FilterOperationLogDto } from './operation-log.dto';

@Controller('operation-logs')
export class OperationLogController {
  constructor(private readonly service: OperationLogService) {}

  @Get()
  findAll(@Query() filter: FilterOperationLogDto) {
    return this.service.findAll(filter);
  }

  @Get('entity/:entityType/:entityId')
  findByEntity(
    @Param('entityType') entityType: string,
    @Param('entityId') entityId: string,
  ) {
    return this.service.findByEntity(entityType, entityId);
  }
}
