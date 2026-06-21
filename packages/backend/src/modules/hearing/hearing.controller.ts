import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Put,
  Query,
} from '@nestjs/common';
import {
  ApiBody,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { HearingService } from './hearing.service';
import {
  ConflictCheckDto,
  ConflictCheckResultDto,
  CreateHearingDto,
  QueryHearingDto,
  UpdateHearingDto,
  UpdateHearingStatusDto,
  HearingResponseDto,
  StatusTimelineResponseDto,
} from './dto';
import { PaginatedResultDto } from '../../common/dto/pagination.dto';

@ApiTags('开庭日历')
@Controller('hearings')
export class HearingController {
  constructor(private readonly hearingService: HearingService) {}

  @Post()
  @ApiOperation({ summary: '创建开庭记录' })
  @ApiBody({ type: CreateHearingDto })
  @ApiResponse({ status: 201, type: HearingResponseDto })
  create(@Body() dto: CreateHearingDto): Promise<HearingResponseDto> {
    return this.hearingService.create(dto);
  }

  @Post('check-conflict')
  @ApiOperation({ summary: '开庭冲突预检测' })
  @ApiBody({ type: ConflictCheckDto })
  @ApiResponse({ status: 200, type: ConflictCheckResultDto })
  checkConflicts(
    @Body() dto: ConflictCheckDto,
  ): Promise<ConflictCheckResultDto> {
    return this.hearingService.checkConflicts(dto);
  }

  @Post('create-with-check')
  @ApiOperation({ summary: '带冲突检测创建开庭记录' })
  @ApiBody({ type: CreateHearingDto })
  @ApiQuery({
    name: 'autoResolve',
    description: '是否忽略冲突强制创建',
    required: false,
    type: Boolean,
  })
  @ApiResponse({ status: 201, type: HearingResponseDto })
  createWithConflictCheck(
    @Body() dto: CreateHearingDto,
    @Query('autoResolve') autoResolve?: string,
  ): Promise<HearingResponseDto> {
    return this.hearingService.createWithConflictCheck(
      dto,
      autoResolve === 'true',
    );
  }

  @Get()
  @ApiOperation({ summary: '分页查询开庭列表' })
  @ApiResponse({ status: 200, type: PaginatedResultDto<HearingResponseDto> })
  findAll(
    @Query() query: QueryHearingDto,
  ): Promise<PaginatedResultDto<HearingResponseDto>> {
    return this.hearingService.findAll(query);
  }

  @Get('calendar')
  @ApiOperation({ summary: '按日历范围查询开庭' })
  @ApiQuery({
    name: 'startTimeFrom',
    description: '开始时间（ISO格式）',
    required: true,
  })
  @ApiQuery({
    name: 'startTimeTo',
    description: '结束时间（ISO格式）',
    required: true,
  })
  @ApiResponse({ status: 200, type: [HearingResponseDto] })
  findByCalendarRange(
    @Query('startTimeFrom') startTimeFrom: string,
    @Query('startTimeTo') startTimeTo: string,
  ): Promise<HearingResponseDto[]> {
    return this.hearingService.findByCalendarRange(startTimeFrom, startTimeTo);
  }

  @Get(':id')
  @ApiOperation({ summary: '获取开庭详情' })
  @ApiParam({ name: 'id', description: '开庭ID' })
  @ApiResponse({ status: 200, type: HearingResponseDto })
  findOne(@Param('id') id: string): Promise<HearingResponseDto> {
    return this.hearingService.findOne(id);
  }

  @Get(':id/timelines')
  @ApiOperation({ summary: '获取开庭状态变更时间线' })
  @ApiParam({ name: 'id', description: '开庭ID' })
  @ApiResponse({ status: 200, type: [StatusTimelineResponseDto] })
  getTimelines(
    @Param('id') id: string,
  ): Promise<StatusTimelineResponseDto[]> {
    return this.hearingService.getTimelines(id);
  }

  @Put(':id')
  @ApiOperation({ summary: '更新开庭记录' })
  @ApiParam({ name: 'id', description: '开庭ID' })
  @ApiBody({ type: UpdateHearingDto })
  @ApiQuery({ name: 'operatorId', description: '操作人ID', required: true })
  @ApiResponse({ status: 200, type: HearingResponseDto })
  update(
    @Param('id') id: string,
    @Body() dto: UpdateHearingDto,
    @Query('operatorId') operatorId: string,
  ): Promise<HearingResponseDto> {
    return this.hearingService.update(id, dto, operatorId);
  }

  @Patch(':id/status')
  @ApiOperation({ summary: '变更开庭状态（自动记录时间线）' })
  @ApiParam({ name: 'id', description: '开庭ID' })
  @ApiBody({ type: UpdateHearingStatusDto })
  @ApiResponse({ status: 200, type: HearingResponseDto })
  updateStatus(
    @Param('id') id: string,
    @Body() dto: UpdateHearingStatusDto,
  ): Promise<HearingResponseDto> {
    return this.hearingService.updateStatus(id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: '删除开庭记录' })
  @ApiParam({ name: 'id', description: '开庭ID' })
  @ApiResponse({ status: 204, description: '删除成功' })
  remove(@Param('id') id: string): Promise<void> {
    return this.hearingService.remove(id);
  }
}
