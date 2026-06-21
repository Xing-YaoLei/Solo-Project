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
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { RescheduleService, AffectedParty } from './reschedule.service';
import { CreateRescheduleDto } from './dto/create-reschedule.dto';
import { UpdateRescheduleDto } from './dto/update-reschedule.dto';
import { QueryRescheduleDto } from './dto/query-reschedule.dto';
import { ApproveRescheduleDto } from './dto/approve-reschedule.dto';
import { RescheduleRecord } from '@prisma/client';

@ApiTags('改约申请 (Reschedule)')
@Controller('reschedules')
export class RescheduleController {
  constructor(private readonly rescheduleService: RescheduleService) {}

  @Post()
  @ApiOperation({ summary: '创建改约申请' })
  @ApiResponse({ status: 201, description: '申请创建成功' })
  @ApiResponse({ status: 404, description: '原开庭不存在' })
  @ApiResponse({ status: 400, description: '原开庭状态不允许改约' })
  create(@Body() dto: CreateRescheduleDto): Promise<RescheduleRecord> {
    return this.rescheduleService.create(dto);
  }

  @Get()
  @ApiOperation({ summary: '获取改约申请列表（分页）' })
  @ApiResponse({ status: 200, description: '获取成功' })
  findAll(@Query() query: QueryRescheduleDto) {
    return this.rescheduleService.findAll(query);
  }

  @Get('stats')
  @ApiOperation({ summary: '获取改约统计数据' })
  @ApiResponse({ status: 200, description: '获取成功' })
  getStats() {
    return this.rescheduleService.getRescheduleStats();
  }

  @Get(':id')
  @ApiOperation({ summary: '获取改约申请详情' })
  @ApiResponse({ status: 200, description: '获取成功' })
  @ApiResponse({ status: 404, description: '改约申请不存在' })
  findOne(@Param('id') id: string): Promise<RescheduleRecord> {
    return this.rescheduleService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: '更新改约申请' })
  @ApiResponse({ status: 200, description: '更新成功' })
  @ApiResponse({ status: 404, description: '改约申请不存在' })
  @ApiResponse({ status: 400, description: '已审批的申请不可修改' })
  update(
    @Param('id') id: string,
    @Body() dto: UpdateRescheduleDto,
  ): Promise<RescheduleRecord> {
    return this.rescheduleService.update(id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: '删除改约申请' })
  @ApiResponse({ status: 204, description: '删除成功' })
  @ApiResponse({ status: 404, description: '改约申请不存在' })
  @ApiResponse({ status: 400, description: '已审批的申请不可删除' })
  remove(@Param('id') id: string): Promise<void> {
    return this.rescheduleService.remove(id);
  }

  @Post(':id/approve')
  @ApiOperation({ summary: '审批改约申请' })
  @ApiResponse({ status: 200, description: '审批完成' })
  @ApiResponse({ status: 404, description: '改约申请或审批人不存在' })
  @ApiResponse({ status: 400, description: '已审批/无权限' })
  approve(
    @Param('id') id: string,
    @Body() dto: ApproveRescheduleDto,
  ): Promise<RescheduleRecord> {
    return this.rescheduleService.approve(id, dto);
  }

  @Get('hearing/:hearingId/affected-parties')
  @ApiOperation({ summary: '获取开庭改约受影响人员名单' })
  @ApiResponse({ status: 200, description: '获取成功' })
  getAffectedParties(
    @Param('hearingId') hearingId: string,
  ): Promise<AffectedParty[]> {
    return this.rescheduleService.getAffectedParties(hearingId);
  }

  @Get('hearing/:hearingId/history')
  @ApiOperation({ summary: '获取开庭的改约历史记录' })
  @ApiResponse({ status: 200, description: '获取成功' })
  getHistory(
    @Param('hearingId') hearingId: string,
  ): Promise<RescheduleRecord[]> {
    return this.rescheduleService.getRescheduleHistory(hearingId);
  }

  @Post(':rescheduleId/link-hearing/:newHearingId')
  @ApiOperation({ summary: '关联改约申请与新开庭' })
  @ApiResponse({ status: 200, description: '关联成功' })
  @ApiResponse({ status: 404, description: '改约申请或新开庭不存在' })
  @ApiResponse({ status: 400, description: '新开庭案件不匹配' })
  linkHearing(
    @Param('rescheduleId') rescheduleId: string,
    @Param('newHearingId') newHearingId: string,
  ): Promise<RescheduleRecord> {
    return this.rescheduleService.linkRescheduledHearing(rescheduleId, newHearingId);
  }
}
