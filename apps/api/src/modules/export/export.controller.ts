import { Controller, Get, Post, Param, Body, Query } from '@nestjs/common';
import { ExportService } from './export.service';

@Controller('exports')
export class ExportController {
  constructor(private readonly service: ExportService) {}

  @Get('tasks')
  listTasks(@Query('activityId') activityId?: string) {
    return this.service.listTasks(activityId);
  }

  @Get('caliber/:exportType')
  downloadDefinition(@Param('exportType') exportType: string) {
    return this.service.downloadDefinition(exportType);
  }

  @Post()
  trigger(@Body() data: any) {
    return this.service.triggerExport(data);
  }
}
