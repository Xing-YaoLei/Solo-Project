import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { StatusTimeline } from '@prisma/client';
import { CreateTimelineDto, TimelineChangeType } from './dto/create-timeline.dto';
import { QueryTimelineDto } from './dto/query-timeline.dto';
import { ChangeTypeDto } from './dto/get-change-types.dto';
import { buildPaginatedResult, PaginatedResultDto } from '../../common/dto/pagination.dto';

@Injectable()
export class TimelineService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateTimelineDto): Promise<StatusTimeline> {
    const hearing = await this.prisma.hearing.findUnique({
      where: { id: dto.hearingId },
    });
    if (!hearing) {
      throw new NotFoundException('开庭不存在');
    }

    const operator = await this.prisma.user.findUnique({
      where: { id: dto.operatorId },
    });
    if (!operator) {
      throw new NotFoundException('操作人不存在');
    }

    return this.prisma.statusTimeline.create({
      data: {
        hearingId: dto.hearingId,
        previousStatus: dto.previousStatus,
        newStatus: dto.newStatus,
        changeType: dto.changeType,
        description: dto.description,
        operatorId: dto.operatorId,
        operatorName: dto.operatorName,
        changeReason: dto.changeReason,
        metadata: dto.metadata,
      },
    });
  }

  async findOne(id: string): Promise<StatusTimeline> {
    const record = await this.prisma.statusTimeline.findUnique({
      where: { id },
    });
    if (!record) {
      throw new NotFoundException('时间线记录不存在');
    }
    return record;
  }

  async findAll(dto: QueryTimelineDto): Promise<PaginatedResultDto<StatusTimeline>> {
    const page = dto.page || 1;
    const limit = dto.limit || 20;
    const skip = (page - 1) * limit;

    const where: any = {};
    if (dto.hearingId) where.hearingId = dto.hearingId;
    if (dto.changeType) {
      where.changeType = dto.changeType;
    } else if (dto.changeTypes && dto.changeTypes.length > 0) {
      where.changeType = { in: dto.changeTypes };
    }
    if (dto.operatorId) where.operatorId = dto.operatorId;
    if (dto.startTime || dto.endTime) {
      where.createdAt = {};
      if (dto.startTime) where.createdAt.gte = new Date(dto.startTime);
      if (dto.endTime) where.createdAt.lte = new Date(dto.endTime);
    }

    const [list, total] = await Promise.all([
      this.prisma.statusTimeline.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.statusTimeline.count({ where }),
    ]);

    return buildPaginatedResult(list, total, page, limit);
  }

  async findByHearingId(
    hearingId: string,
    dto: QueryTimelineDto,
  ): Promise<PaginatedResultDto<StatusTimeline>> {
    const hearing = await this.prisma.hearing.findUnique({
      where: { id: hearingId },
    });
    if (!hearing) {
      throw new NotFoundException('开庭不存在');
    }
    return this.findAll({ ...dto, hearingId });
  }

  async remove(id: string): Promise<void> {
    const record = await this.prisma.statusTimeline.findUnique({
      where: { id },
    });
    if (!record) {
      throw new NotFoundException('时间线记录不存在');
    }
    await this.prisma.statusTimeline.delete({ where: { id } });
  }

  async getChangeTypes(): Promise<ChangeTypeDto[]> {
    const builtIn: ChangeTypeDto[] = [
      { value: TimelineChangeType.SCHEDULE, label: '排期' },
      { value: TimelineChangeType.CONFIRM, label: '确认' },
      { value: TimelineChangeType.START, label: '开始' },
      { value: TimelineChangeType.COMPLETE, label: '完成' },
      { value: TimelineChangeType.RESCHEDULE, label: '改约' },
      { value: TimelineChangeType.CANCEL, label: '取消' },
      { value: TimelineChangeType.POSTPONE, label: '延期' },
      { value: TimelineChangeType.ATTENDANCE, label: '到场' },
      { value: TimelineChangeType.EXCEPTION, label: '异常' },
      { value: TimelineChangeType.REMINDER, label: '提醒' },
      { value: TimelineChangeType.CONFLICT, label: '冲突' },
      { value: TimelineChangeType.OTHER, label: '其他' },
    ];

    const records = await this.prisma.statusTimeline.findMany({
      distinct: ['changeType'],
      select: { changeType: true },
    });

    const fromDb = records.map((r) => r.changeType);
    const existingValues = new Set(builtIn.map((b) => b.value));

    for (const ct of fromDb) {
      if (!existingValues.has(ct)) {
        builtIn.push({ value: ct, label: ct });
      }
    }

    return builtIn;
  }

  async recordHearingStatusChange(
    hearingId: string,
    previousStatus: string | null,
    newStatus: string,
    operatorId: string,
    operatorName: string,
    changeReason?: string,
    description?: string,
    metadata?: Record<string, any>,
  ): Promise<StatusTimeline> {
    let changeType: string;
    switch (newStatus) {
      case 'SCHEDULED':
        changeType = TimelineChangeType.SCHEDULE;
        break;
      case 'CONFIRMED':
        changeType = TimelineChangeType.CONFIRM;
        break;
      case 'IN_PROGRESS':
        changeType = TimelineChangeType.START;
        break;
      case 'COMPLETED':
        changeType = TimelineChangeType.COMPLETE;
        break;
      case 'RESCHEDULED':
        changeType = TimelineChangeType.RESCHEDULE;
        break;
      case 'CANCELLED':
        changeType = TimelineChangeType.CANCEL;
        break;
      case 'POSTPONED':
        changeType = TimelineChangeType.POSTPONE;
        break;
      default:
        changeType = TimelineChangeType.OTHER;
    }

    return this.create({
      hearingId,
      previousStatus: previousStatus ?? undefined,
      newStatus,
      changeType,
      description,
      operatorId,
      operatorName,
      changeReason,
      metadata,
    });
  }

  async recordAttendanceChange(
    hearingId: string,
    personName: string,
    attendanceStatus: string,
    operatorId: string,
    operatorName: string,
    metadata?: Record<string, any>,
  ): Promise<StatusTimeline> {
    return this.create({
      hearingId,
      previousStatus: undefined,
      newStatus: attendanceStatus,
      changeType: TimelineChangeType.ATTENDANCE,
      description: `${personName} 状态变更为 ${attendanceStatus}`,
      operatorId,
      operatorName,
      changeReason: undefined,
      metadata,
    });
  }

  async recordException(
    hearingId: string,
    exceptionType: string,
    title: string,
    operatorId: string,
    operatorName: string,
    metadata?: Record<string, any>,
  ): Promise<StatusTimeline> {
    return this.create({
      hearingId,
      previousStatus: undefined,
      newStatus: 'EXCEPTION',
      changeType: TimelineChangeType.EXCEPTION,
      description: `[${exceptionType}] ${title}`,
      operatorId,
      operatorName,
      changeReason: undefined,
      metadata,
    });
  }

  async recordConflict(
    hearingId: string,
    conflictType: string,
    description: string,
    operatorId: string,
    operatorName: string,
    metadata?: Record<string, any>,
  ): Promise<StatusTimeline> {
    return this.create({
      hearingId,
      previousStatus: undefined,
      newStatus: 'CONFLICT',
      changeType: TimelineChangeType.CONFLICT,
      description: `[${conflictType}] ${description}`,
      operatorId,
      operatorName,
      changeReason: undefined,
      metadata,
    });
  }
}
