import {
  ConflictSeverity,
  ConflictType,
  Hearing,
  HearingAssignment,
  HearingStatus,
  Prisma,
  StatusTimeline,
} from '@prisma/client';
import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import {
  ConflictCheckDto,
  ConflictCheckResultDto,
  ConflictItemDto,
  CreateHearingDto,
  QueryHearingDto,
  UpdateHearingDto,
  UpdateHearingStatusDto,
  HearingResponseDto,
  HearingAssignmentResponseDto,
  StatusTimelineResponseDto,
} from './dto';
import {
  PaginatedResultDto,
  buildPaginatedResult,
} from '../../common/dto/pagination.dto';

type HearingWithRelations = Hearing & {
  caseInfo?: { title: string; caseNo: string };
  court?: { name: string };
  courtRoom?: { roomNo: string; roomName?: string | null };
  presidingJudge?: { name: string } | null;
  creator?: { realName: string };
  assignments?: (HearingAssignment & {
    assignee?: { realName: string };
  })[];
  timelines?: StatusTimeline[];
};

@Injectable()
export class HearingService {
  constructor(private readonly prisma: PrismaService) {}

  private readonly DEFAULT_INCLUDE = {
    caseInfo: { select: { title: true, caseNo: true } },
    court: { select: { name: true } },
    courtRoom: { select: { roomNo: true, roomName: true } },
    presidingJudge: { select: { name: true } },
    creator: { select: { realName: true } },
    assignments: {
      include: {
        assignee: { select: { realName: true } },
      },
    },
  };

  private mapToResponse(hearing: HearingWithRelations): HearingResponseDto {
    return {
      id: hearing.id,
      hearingNo: hearing.hearingNo,
      caseId: hearing.caseId,
      caseTitle: hearing.caseInfo?.title,
      caseNo: hearing.caseInfo?.caseNo,
      courtId: hearing.courtId,
      courtName: hearing.court?.name,
      courtRoomId: hearing.courtRoomId,
      courtRoomNo: hearing.courtRoom?.roomNo,
      courtRoomName: hearing.courtRoom?.roomName ?? undefined,
      presidingJudgeId: hearing.presidingJudgeId ?? undefined,
      presidingJudgeName: hearing.presidingJudge?.name,
      startTime: hearing.startTime.toISOString(),
      endTime: hearing.endTime.toISOString(),
      hearingType: hearing.hearingType,
      judgeSummary: hearing.judgeSummary ?? undefined,
      preparationItems: hearing.preparationItems ?? undefined,
      materials: hearing.materials ?? undefined,
      status: hearing.status,
      isImportant: hearing.isImportant,
      priority: hearing.priority,
      creatorId: hearing.creatorId,
      creatorName: hearing.creator?.realName,
      createdAt: hearing.createdAt.toISOString(),
      updatedAt: hearing.updatedAt.toISOString(),
      assignments: hearing.assignments?.map((a) =>
        this.mapAssignmentToResponse(a),
      ),
      timelines: hearing.timelines?.map((t) => this.mapTimelineToResponse(t)),
    };
  }

  private mapAssignmentToResponse(
    assignment: HearingAssignment & { assignee?: { realName: string } },
  ): HearingAssignmentResponseDto {
    return {
      id: assignment.id,
      hearingId: assignment.hearingId,
      assigneeId: assignment.assigneeId,
      assigneeName: assignment.assignee?.realName,
      role: assignment.role,
      isLead: assignment.isLead,
      notes: assignment.notes ?? undefined,
      createdAt: assignment.createdAt.toISOString(),
      updatedAt: assignment.updatedAt.toISOString(),
    };
  }

  private mapTimelineToResponse(
    timeline: StatusTimeline,
  ): StatusTimelineResponseDto {
    return {
      id: timeline.id,
      hearingId: timeline.hearingId,
      previousStatus: timeline.previousStatus ?? undefined,
      newStatus: timeline.newStatus,
      changeType: timeline.changeType,
      description: timeline.description ?? undefined,
      operatorId: timeline.operatorId,
      operatorName: timeline.operatorName,
      changeReason: timeline.changeReason ?? undefined,
      createdAt: timeline.createdAt.toISOString(),
    };
  }

  private getChangeType(status: HearingStatus): string {
    const map: Record<HearingStatus, string> = {
      [HearingStatus.SCHEDULED]: '排期',
      [HearingStatus.CONFIRMED]: '确认',
      [HearingStatus.IN_PROGRESS]: '进行中',
      [HearingStatus.COMPLETED]: '完成',
      [HearingStatus.RESCHEDULED]: '改期',
      [HearingStatus.CANCELLED]: '取消',
      [HearingStatus.POSTPONED]: '延期',
    };
    return map[status] || '状态变更';
  }

  private async validateTimeRange(startTime: string, endTime: string) {
    const start = new Date(startTime);
    const end = new Date(endTime);
    if (start >= end) {
      throw new BadRequestException('结束时间必须晚于开始时间');
    }
  }

  async create(dto: CreateHearingDto): Promise<HearingResponseDto> {
    await this.validateTimeRange(dto.startTime, dto.endTime);

    const existing = await this.prisma.hearing.findUnique({
      where: { hearingNo: dto.hearingNo },
    });
    if (existing) {
      throw new BadRequestException('开庭编号已存在');
    }

    const creator = await this.prisma.user.findUnique({
      where: { id: dto.creatorId },
    });
    if (!creator) {
      throw new NotFoundException('创建人不存在');
    }

    const result = await this.prisma.$transaction(async (tx) => {
      const hearing = await tx.hearing.create({
        data: {
          hearingNo: dto.hearingNo,
          caseId: dto.caseId,
          courtId: dto.courtId,
          courtRoomId: dto.courtRoomId,
          presidingJudgeId: dto.presidingJudgeId,
          startTime: new Date(dto.startTime),
          endTime: new Date(dto.endTime),
          hearingType: dto.hearingType,
          judgeSummary: dto.judgeSummary,
          preparationItems: dto.preparationItems,
          materials: dto.materials,
          status: HearingStatus.SCHEDULED,
          isImportant: dto.isImportant ?? false,
          priority: dto.priority ?? 5,
          creatorId: dto.creatorId,
        },
        include: this.DEFAULT_INCLUDE,
      });

      if (dto.assignments && dto.assignments.length > 0) {
        await tx.hearingAssignment.createMany({
          data: dto.assignments.map((a) => ({
            hearingId: hearing.id,
            assigneeId: a.assigneeId,
            role: a.role,
            isLead: a.isLead ?? false,
            notes: a.notes,
          })),
          skipDuplicates: true,
        });
      }

      await tx.statusTimeline.create({
        data: {
          hearingId: hearing.id,
          previousStatus: null,
          newStatus: HearingStatus.SCHEDULED,
          changeType: this.getChangeType(HearingStatus.SCHEDULED),
          description: '创建开庭排期',
          operatorId: dto.creatorId,
          operatorName: creator.realName,
        },
      });

      return tx.hearing.findUnique({
        where: { id: hearing.id },
        include: {
          ...this.DEFAULT_INCLUDE,
          timelines: {
            orderBy: { createdAt: 'desc' },
          },
        },
      });
    });

    return this.mapToResponse(result!);
  }

  async findAll(
    query: QueryHearingDto,
  ): Promise<PaginatedResultDto<HearingResponseDto>> {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const skip = (page - 1) * limit;

    const where: Prisma.HearingWhereInput = {};

    if (query.startTimeFrom && query.startTimeTo) {
      where.AND = [
        { startTime: { gte: new Date(query.startTimeFrom) } },
        { startTime: { lte: new Date(query.startTimeTo) } },
      ];
    } else if (query.startTimeFrom) {
      where.startTime = { gte: new Date(query.startTimeFrom) };
    } else if (query.startTimeTo) {
      where.startTime = { lte: new Date(query.startTimeTo) };
    }

    if (query.caseId) where.caseId = query.caseId;
    if (query.courtId) where.courtId = query.courtId;
    if (query.courtRoomId) where.courtRoomId = query.courtRoomId;
    if (query.presidingJudgeId)
      where.presidingJudgeId = query.presidingJudgeId;
    if (query.hearingType) where.hearingType = query.hearingType;
    if (query.isImportant !== undefined) where.isImportant = query.isImportant;
    if (query.creatorId) where.creatorId = query.creatorId;

    if (query.statuses && query.statuses.length > 0) {
      where.status = { in: query.statuses };
    }

    if (query.priorityMin !== undefined || query.priorityMax !== undefined) {
      const priorityFilter: Prisma.IntFilter = {};
      if (query.priorityMin !== undefined) priorityFilter.gte = query.priorityMin;
      if (query.priorityMax !== undefined) priorityFilter.lte = query.priorityMax;
      where.priority = priorityFilter;
    }

    if (query.assigneeId) {
      where.assignments = {
        some: {
          assigneeId: query.assigneeId,
        },
      };
    }

    if (query.keyword) {
      where.OR = [
        { hearingNo: { contains: query.keyword } },
        { caseInfo: { title: { contains: query.keyword } } },
      ];
    }

    const [total, hearings] = await Promise.all([
      this.prisma.hearing.count({ where }),
      this.prisma.hearing.findMany({
        where,
        skip,
        take: limit,
        orderBy: [{ startTime: 'asc' }, { priority: 'desc' }],
        include: this.DEFAULT_INCLUDE,
      }),
    ]);

    return buildPaginatedResult(
      hearings.map((h) => this.mapToResponse(h)),
      total,
      page,
      limit,
    );
  }

  async findByCalendarRange(
    startTimeFrom: string,
    startTimeTo: string,
  ): Promise<HearingResponseDto[]> {
    const hearings = await this.prisma.hearing.findMany({
      where: {
        AND: [
          { startTime: { gte: new Date(startTimeFrom) } },
          { startTime: { lte: new Date(startTimeTo) } },
        ],
        status: {
          notIn: [HearingStatus.CANCELLED],
        },
      },
      orderBy: [{ startTime: 'asc' }, { priority: 'desc' }],
      include: this.DEFAULT_INCLUDE,
    });

    return hearings.map((h) => this.mapToResponse(h));
  }

  async findOne(id: string): Promise<HearingResponseDto> {
    const hearing = await this.prisma.hearing.findUnique({
      where: { id },
      include: {
        ...this.DEFAULT_INCLUDE,
        timelines: {
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!hearing) {
      throw new NotFoundException('开庭记录不存在');
    }

    return this.mapToResponse(hearing);
  }

  async update(
    id: string,
    dto: UpdateHearingDto,
    operatorId: string,
  ): Promise<HearingResponseDto> {
    const existing = await this.prisma.hearing.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundException('开庭记录不存在');
    }

    const startTime = dto.startTime
      ? new Date(dto.startTime)
      : existing.startTime;
    const endTime = dto.endTime ? new Date(dto.endTime) : existing.endTime;

    if (dto.startTime || dto.endTime) {
      await this.validateTimeRange(
        startTime.toISOString(),
        endTime.toISOString(),
      );
    }

    const operator = await this.prisma.user.findUnique({
      where: { id: operatorId },
    });
    if (!operator) {
      throw new NotFoundException('操作人不存在');
    }

    const timeChanged =
      (dto.startTime &&
        new Date(dto.startTime).getTime() !== existing.startTime.getTime()) ||
      (dto.endTime &&
        new Date(dto.endTime).getTime() !== existing.endTime.getTime());

    const result = await this.prisma.$transaction(async (tx) => {
      const data: Prisma.HearingUpdateInput = {};

      if (dto.caseId) data.caseInfo = { connect: { id: dto.caseId } };
      if (dto.courtId) data.court = { connect: { id: dto.courtId } };
      if (dto.courtRoomId) data.courtRoom = { connect: { id: dto.courtRoomId } };
      if (dto.presidingJudgeId !== undefined) {
        data.presidingJudge = dto.presidingJudgeId
          ? { connect: { id: dto.presidingJudgeId } }
          : { disconnect: true };
      }
      if (dto.startTime) data.startTime = new Date(dto.startTime);
      if (dto.endTime) data.endTime = new Date(dto.endTime);
      if (dto.hearingType) data.hearingType = dto.hearingType;
      if (dto.judgeSummary !== undefined) data.judgeSummary = dto.judgeSummary;
      if (dto.preparationItems !== undefined)
        data.preparationItems = dto.preparationItems;
      if (dto.materials !== undefined) data.materials = dto.materials;
      if (dto.isImportant !== undefined) data.isImportant = dto.isImportant;
      if (dto.priority !== undefined) data.priority = dto.priority;

      await tx.hearing.update({
        where: { id },
        data,
      });

      if (dto.assignments) {
        await tx.hearingAssignment.deleteMany({ where: { hearingId: id } });
        if (dto.assignments.length > 0) {
          await tx.hearingAssignment.createMany({
            data: dto.assignments.map((a) => ({
              hearingId: id,
              assigneeId: a.assigneeId,
              role: a.role,
              isLead: a.isLead ?? false,
              notes: a.notes,
            })),
            skipDuplicates: true,
          });
        }
      }

      if (timeChanged) {
        await tx.statusTimeline.create({
          data: {
            hearingId: id,
            previousStatus: existing.status,
            newStatus: existing.status,
            changeType: '时间调整',
            description: `开庭时间从 ${existing.startTime.toLocaleString()} 调整为 ${startTime.toLocaleString()} - ${endTime.toLocaleString()}`,
            operatorId,
            operatorName: operator.realName,
          },
        });
      }

      return tx.hearing.findUnique({
        where: { id },
        include: {
          ...this.DEFAULT_INCLUDE,
          timelines: {
            orderBy: { createdAt: 'desc' },
          },
        },
      });
    });

    return this.mapToResponse(result!);
  }

  async remove(id: string): Promise<void> {
    const existing = await this.prisma.hearing.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundException('开庭记录不存在');
    }

    await this.prisma.hearing.delete({ where: { id } });
  }

  async updateStatus(
    id: string,
    dto: UpdateHearingStatusDto,
  ): Promise<HearingResponseDto> {
    const existing = await this.prisma.hearing.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundException('开庭记录不存在');
    }

    if (existing.status === dto.status) {
      throw new BadRequestException('状态未变更');
    }

    const operator = await this.prisma.user.findUnique({
      where: { id: dto.operatorId },
    });
    if (!operator) {
      throw new NotFoundException('操作人不存在');
    }

    const result = await this.prisma.$transaction(async (tx) => {
      await tx.hearing.update({
        where: { id },
        data: { status: dto.status },
      });

      await tx.statusTimeline.create({
        data: {
          hearingId: id,
          previousStatus: existing.status,
          newStatus: dto.status,
          changeType: this.getChangeType(dto.status),
          description: dto.description,
          operatorId: dto.operatorId,
          operatorName: operator.realName,
          changeReason: dto.changeReason,
        },
      });

      return tx.hearing.findUnique({
        where: { id },
        include: {
          ...this.DEFAULT_INCLUDE,
          timelines: {
            orderBy: { createdAt: 'desc' },
          },
        },
      });
    });

    return this.mapToResponse(result!);
  }

  async getTimelines(hearingId: string): Promise<StatusTimelineResponseDto[]> {
    const hearing = await this.prisma.hearing.findUnique({
      where: { id: hearingId },
    });
    if (!hearing) {
      throw new NotFoundException('开庭记录不存在');
    }

    const timelines = await this.prisma.statusTimeline.findMany({
      where: { hearingId },
      orderBy: { createdAt: 'desc' },
    });

    return timelines.map((t) => this.mapTimelineToResponse(t));
  }

  async checkConflicts(dto: ConflictCheckDto): Promise<ConflictCheckResultDto> {
    await this.validateTimeRange(dto.startTime, dto.endTime);

    const startTime = new Date(dto.startTime);
    const endTime = new Date(dto.endTime);
    const conflicts: ConflictItemDto[] = [];

    const timeOverlapWhere: Prisma.HearingWhereInput = {
      AND: [
        { startTime: { lt: endTime } },
        { endTime: { gt: startTime } },
      ],
      status: {
        notIn: [HearingStatus.CANCELLED, HearingStatus.COMPLETED],
      },
    };

    if (dto.excludeHearingId) {
      timeOverlapWhere.id = { not: dto.excludeHearingId };
    }

    const overlappingHearings = await this.prisma.hearing.findMany({
      where: timeOverlapWhere,
      include: {
        courtRoom: { select: { roomNo: true, roomName: true } },
        presidingJudge: { select: { id: true, name: true } },
        assignments: {
          include: {
            assignee: { select: { id: true, realName: true } },
          },
        },
        caseInfo: { select: { title: true, ownerClientId: true } },
      },
    });

    if (dto.courtRoomId) {
      const roomConflict = overlappingHearings.find(
        (h) => h.courtRoomId === dto.courtRoomId,
      );
      if (roomConflict) {
        conflicts.push({
          conflictType: ConflictType.COURT_ROOM,
          severity: ConflictSeverity.HIGH,
          description: `法庭 ${roomConflict.courtRoom.roomNo}${roomConflict.courtRoom.roomName ? '(' + roomConflict.courtRoom.roomName + ')' : ''} 在该时段已被占用`,
          involvedPartyA: dto.courtRoomId,
          involvedPartyB: roomConflict.id,
          partyAType: 'COURT_ROOM',
          partyBType: 'HEARING',
          partyAName: `${roomConflict.courtRoom.roomNo}${roomConflict.courtRoom.roomName ? '(' + roomConflict.courtRoom.roomName + ')' : ''}`,
          partyBName: roomConflict.caseInfo?.title,
          conflictingHearingId: roomConflict.id,
          conflictingHearingNo: roomConflict.hearingNo,
        });
      }
    }

    if (dto.judgeIds && dto.judgeIds.length > 0) {
      for (const judgeId of dto.judgeIds) {
        const judgeConflict = overlappingHearings.find(
          (h) => h.presidingJudgeId === judgeId,
        );
        if (judgeConflict && judgeConflict.presidingJudge) {
          conflicts.push({
            conflictType: ConflictType.JUDGE_TIME,
            severity: ConflictSeverity.HIGH,
            description: `法官 ${judgeConflict.presidingJudge.name} 在该时段已有安排`,
            involvedPartyA: judgeId,
            involvedPartyB: judgeConflict.id,
            partyAType: 'JUDGE',
            partyBType: 'HEARING',
            partyAName: judgeConflict.presidingJudge.name,
            partyBName: judgeConflict.caseInfo?.title,
            conflictingHearingId: judgeConflict.id,
            conflictingHearingNo: judgeConflict.hearingNo,
          });
        }
      }
    }

    if (dto.assigneeIds && dto.assigneeIds.length > 0) {
      for (const assigneeId of dto.assigneeIds) {
        const lawyerConflict = overlappingHearings.find((h) =>
          h.assignments.some((a) => a.assigneeId === assigneeId),
        );
        if (lawyerConflict) {
          const assignment = lawyerConflict.assignments.find(
            (a) => a.assigneeId === assigneeId,
          );
          conflicts.push({
            conflictType: ConflictType.LAWYER_TIME,
            severity: ConflictSeverity.HIGH,
            description: `律师 ${assignment?.assignee?.realName} 在该时段已被分派至其他开庭`,
            involvedPartyA: assigneeId,
            involvedPartyB: lawyerConflict.id,
            partyAType: 'LAWYER',
            partyBType: 'HEARING',
            partyAName: assignment?.assignee?.realName,
            partyBName: lawyerConflict.caseInfo?.title,
            conflictingHearingId: lawyerConflict.id,
            conflictingHearingNo: lawyerConflict.hearingNo,
          });
        }
      }
    }

    if (dto.caseId) {
      const currentCase = await this.prisma.case.findUnique({
        where: { id: dto.caseId },
        select: { ownerClientId: true },
      });

      if (currentCase) {
        const clientCaseConflict = overlappingHearings.find(
          (h) =>
            h.caseInfo?.ownerClientId === currentCase.ownerClientId &&
            h.caseId !== dto.caseId,
        );
        if (clientCaseConflict) {
          conflicts.push({
            conflictType: ConflictType.CLIENT_CONFLICT,
            severity: ConflictSeverity.MEDIUM,
            description: '同一客户在该时段存在另一开庭，请确认是否存在利益冲突',
            involvedPartyA: dto.caseId,
            involvedPartyB: clientCaseConflict.id,
            partyAType: 'CASE',
            partyBType: 'CASE',
            partyAName: currentCase.ownerClientId,
            partyBName: clientCaseConflict.caseInfo?.title,
            conflictingHearingId: clientCaseConflict.id,
            conflictingHearingNo: clientCaseConflict.hearingNo,
          });
        }
      }
    }

    return {
      hasConflict: conflicts.length > 0,
      conflicts,
    };
  }

  async createWithConflictCheck(
    dto: CreateHearingDto,
    autoResolve = false,
  ): Promise<HearingResponseDto> {
    const assigneeIds = dto.assignments?.map((a) => a.assigneeId) || [];
    const judgeIds = dto.presidingJudgeId ? [dto.presidingJudgeId] : [];

    const conflictResult = await this.checkConflicts({
      startTime: dto.startTime,
      endTime: dto.endTime,
      courtRoomId: dto.courtRoomId,
      judgeIds,
      assigneeIds,
      caseId: dto.caseId,
    });

    if (conflictResult.hasConflict && !autoResolve) {
      const conflictDetails = conflictResult.conflicts
        .map((c) => `[${c.conflictType}] ${c.description}`)
        .join('; ');
      throw new BadRequestException(
        `存在时间冲突：${conflictDetails}`,
      );
    }

    return this.create(dto);
  }
}
