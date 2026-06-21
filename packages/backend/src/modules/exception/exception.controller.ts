import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { ExceptionService } from './exception.service';
import { CreateExceptionDto } from './dto/create-exception.dto';
import { UpdateExceptionDto } from './dto/update-exception.dto';
import { QueryExceptionDto } from './dto/query-exception.dto';
import { CreateTimelineDto } from './dto/timeline.dto';

@ApiTags('exception')
@ApiBearerAuth()
@Controller('exceptions')
export class ExceptionController {
  constructor(private readonly exceptionService: ExceptionService) {}

  @Post()
  @ApiOperation({ summary: '创建异常单（利益冲突等）' })
  create(@Body() createExceptionDto: CreateExceptionDto) {
    const mockCreatorId = '00000000-0000-0000-0000-000000000000';
    return this.exceptionService.create(createExceptionDto, mockCreatorId);
  }

  @Get()
  @ApiOperation({ summary: '获取异常单列表（分页）' })
  findAll(@Query() query: QueryExceptionDto) {
    return this.exceptionService.findAll(query);
  }

  @Get('stats')
  @ApiOperation({ summary: '获取异常单统计信息' })
  getStats(
    @Query('caseId') caseId?: string,
    @Query('hearingId') hearingId?: string,
  ) {
    return this.exceptionService.getExceptionStats(caseId, hearingId);
  }

  @Get(':id')
  @ApiOperation({ summary: '获取异常单详情' })
  findOne(@Param('id') id: string) {
    return this.exceptionService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: '更新异常单（含影响范围/责任归属/处理结果等）' })
  update(
    @Param('id') id: string,
    @Body() updateExceptionDto: UpdateExceptionDto,
  ) {
    const mockOperatorId = '00000000-0000-0000-0000-000000000000';
    return this.exceptionService.update(id, updateExceptionDto, mockOperatorId);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: '删除异常单' })
  remove(@Param('id') id: string) {
    return this.exceptionService.remove(id);
  }

  @Post(':id/escalate')
  @ApiOperation({ summary: '升级异常单' })
  escalate(
    @Param('id') id: string,
    @Body('description') description?: string,
  ) {
    const mockOperatorId = '00000000-0000-0000-0000-000000000000';
    return this.exceptionService.escalateException(id, mockOperatorId, description);
  }

  @Post(':id/timeline')
  @ApiOperation({ summary: '新增异常单时间线记录' })
  addTimeline(@Body() createTimelineDto: CreateTimelineDto) {
    return this.exceptionService.addTimeline(createTimelineDto);
  }

  @Get(':id/timeline')
  @ApiOperation({ summary: '获取异常单时间线' })
  getTimeline(@Param('id') id: string) {
    return this.exceptionService.getTimeline(id);
  }
}
