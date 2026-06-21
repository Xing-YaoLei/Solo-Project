import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  Query,
  HttpCode,
  HttpStatus,
  ApiTags,
  ApiOperation,
  ApiResponse,
} from '@nestjs/common';
import { ApiBearerAuth } from '@nestjs/swagger';
import { TimelineService } from './timeline.service';
import { CreateTimelineDto } from './dto/create-timeline.dto';
import { QueryTimelineDto } from './dto/query-timeline.dto';
import { ChangeTypeDto } from './dto/get-change-types.dto';
import { StatusTimeline } from '@prisma/client';
import { PaginatedResultDto } from '../../common/dto/pagination.dto';

@ApiTags('timeline')
@ApiBearerAuth()
@Controller('timeline')
export class TimelineController {
  constructor(private readonly timelineService: TimelineService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: '创建时间线记录' })
  @ApiResponse({ status: 201, description: '创建成功' })
  create(@Body() dto: CreateTimelineDto): Promise<StatusTimeline> {
    return this.timelineService.create(dto);
  }

  @Get()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '查询时间线列表（支持按 hearingId、变更类型等筛选）' })
  findAll(@Query() dto: QueryTimelineDto): Promise<PaginatedResultDto<StatusTimeline>> {
    return this.timelineService.findAll(dto);
  }

  @Get('change-types')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '获取变更类型列表' })
  getChangeTypes(): Promise<ChangeTypeDto[]> {
    return this.timelineService.getChangeTypes();
  }

  @Get('hearing/:hearingId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '按开庭ID查询时间线（支持变更类型等筛选）' })
  findByHearingId(
    @Param('hearingId') hearingId: string,
    @Query() dto: QueryTimelineDto,
  ): Promise<PaginatedResultDto<StatusTimeline>> {
    return this.timelineService.findByHearingId(hearingId, dto);
  }

  @Get(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '获取单条时间线记录详情' })
  findOne(@Param('id') id: string): Promise<StatusTimeline> {
    return this.timelineService.findOne(id);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: '删除时间线记录' })
  remove(@Param('id') id: string): Promise<void> {
    return this.timelineService.remove(id);
  }
}
