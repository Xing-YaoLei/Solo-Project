import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  Res,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { Response } from 'express';
import { ExportService } from './export.service';
import { ExportExcelDto, QueryExportRecordDto } from './dto/export.dto';

@ApiTags('export')
@ApiBearerAuth()
@Controller('exports')
export class ExportController {
  constructor(private readonly exportService: ExportService) {}

  @Post('excel')
  @ApiOperation({ summary: '导出Excel（含口径说明sheet）' })
  async exportExcel(
    @Body() dto: ExportExcelDto,
    @Res() response: Response,
  ) {
    const mockExportedById = '00000000-0000-0000-0000-000000000000';
    return this.exportService.exportExcel(dto, response, mockExportedById);
  }

  @Get('records')
  @ApiOperation({ summary: '获取导出记录列表（分页）' })
  findAllExportRecords(@Query() query: QueryExportRecordDto) {
    return this.exportService.findAllExportRecords(query);
  }

  @Get('calibers')
  @ApiOperation({ summary: '获取所有导出类型的字段口径列表' })
  getCaliberList() {
    return this.exportService.getCaliberList();
  }

  @Get('records/:id')
  @ApiOperation({ summary: '获取导出记录详情' })
  findOneExportRecord(@Param('id') id: string) {
    return this.exportService.findOneExportRecord(id);
  }
}
