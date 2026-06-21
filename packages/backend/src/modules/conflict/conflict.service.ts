import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateConflictDto } from './dto/create-conflict.dto';
import { UpdateConflictDto } from './dto/update-conflict.dto';
import { QueryConflictDto } from './dto/query-conflict.dto';
import { ResolveConflictDto } from './dto/resolve-conflict.dto';
import { DetectConflictDto } from './dto/detect-conflict.dto';
import { ConflictType, ConflictSeverity, ConflictCheck, HearingStatus } from '@prisma/client';
import { buildPaginatedResult, PaginatedResultDto } from '../../common/dto/pagination.dto';

const ALL_CHECK_TYPES = [
  ConflictType.LAWYER_TIME,
  ConflictType.COURT_ROOM,
  ConflictType.CLIENT_CONFLICT,
  ConflictType.JUDGE_TIME,
  ConflictType.CASE_CONFLICT,
];

interface TimeOverlap {
  start: Date;
  end: Date;
}

function isTimeOverlap(a: TimeOverlap, b: TimeOverlap): boolean {
  return a.start < b.end && b.start < a.end;
}

@Injectable()
export class ConflictService {
  private readonly logger = new Logger(ConflictService.name);

  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateConflictDto): Promise<ConflictCheck> {
    return this.prisma.conflictCheck.create({
      data: {
        hearingId: dto.hearingId,
        conflictType: dto.conflictType,
        severity: dto.severity,
        description: dto.description,
        involvedPartyA: dto.involvedPartyA,
        involvedPartyB: dto.involvedPartyB,
        partyAType: dto.partyAType,
        partyBType: dto.partyBType,
        partyAName: dto.partyAName,
        partyBName: dto.partyBName,
        caseId: dto.caseId,
        partyAClientId: dto.partyAClientId,
        partyBClientId: dto.partyBClientId,
      },
      include: {
        hearing: true,
        case: true,
      },
    });
  }

  async findAll(dto: QueryConflictDto): Promise<PaginatedResultDto<ConflictCheck>> {
    const page = dto.page || 1;
    const limit = dto.limit || 20;
    const skip = (page - 1) * limit;

    const where: Record<string, any> = {};

    if (dto.hearingId) where.hearingId = dto.hearingId;
    if (dto.conflictType) where.conflictType = dto.conflictType;
    if (dto.severity) where.severity = dto.severity;
    if (dto.isResolved !== undefined) where.isResolved = dto.isResolved;
    if (dto.caseId) where.caseId = dto.caseId;
    if (dto.partyAClientId) where.partyAClientId = dto.partyAClientId;
    if (dto.partyBClientId) where.partyBClientId = dto.partyBClientId;

    if (dto.keyword) {
      where.OR = [
        { description: { contains: dto.keyword, mode: 'insensitive' } },
        { partyAName: { contains: dto.keyword, mode: 'insensitive' } },
        { partyBName: { contains: dto.keyword, mode: 'insensitive' } },
      ];
    }

    const [list, total] = await Promise.all([
      this.prisma.conflictCheck.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          hearing: {
            include: {
              caseInfo: true,
              court: true,
              courtRoom: true,
            },
          },
          case: true,
        },
      }),
      this.prisma.conflictCheck.count({ where }),
    ]);

    return buildPaginatedResult(list, total, page, limit);
  }

  async findOne(id: string): Promise<ConflictCheck> {
    const conflict = await this.prisma.conflictCheck.findUnique({
      where: { id },
      include: {
        hearing: {
          include: {
            caseInfo: true,
            court: true,
            courtRoom: true,
            assignments: true,
          },
        },
        case: true,
        partyAClient: true,
        partyBClient: true,
      },
    });

    if (!conflict) {
      throw new NotFoundException(`Conflict record not found: ${id}`);
    }

    return conflict;
  }

  async update(id: string, dto: UpdateConflictDto): Promise<ConflictCheck> {
    await this.findOne(id);

    return this.prisma.conflictCheck.update({
      where: { id },
      data: {
        ...dto,
      },
      include: {
        hearing: true,
        case: true,
      },
    });
  }

  async remove(id: string): Promise<void> {
    await this.findOne(id);
    await this.prisma.conflictCheck.delete({ where: { id } });
  }

  async resolve(id: string, dto: ResolveConflictDto): Promise<ConflictCheck> {
    await this.findOne(id);

    return this.prisma.conflictCheck.update({
      where: { id },
      data: {
        isResolved: true,
        resolvedAt: new Date(),
        resolvedBy: dto.resolvedBy,
        resolution: dto.resolution,
      },
      include: {
        hearing: true,
        case: true,
      },
    });
  }

  async bulkResolve(ids: string[], dto: ResolveConflictDto): Promise<number> {
    const result = await this.prisma.conflictCheck.updateMany({
      where: {
        id: { in: ids },
        isResolved: false,
      },
      data: {
        isResolved: true,
        resolvedAt: new Date(),
        resolvedBy: dto.resolvedBy,
        resolution: dto.resolution,
      },
    });
    return result.count;
  }

  async detect(dto: DetectConflictDto): Promise<ConflictCheck[]> {
    const checkTypes = dto.checkTypes && dto.checkTypes.length > 0
      ? dto.checkTypes
      : ALL_CHECK_TYPES;

    const startTime = new Date(dto.startTime);
    const endTime = new Date(dto.endTime);

    const conflicts: ConflictCheck[] = [];

    if (checkTypes.includes(ConflictType.LAWYER_TIME)) {
      const lawyerConflicts = await this.detectLawyerTimeConflict(
        dto.caseId,
        dto.hearingId,
        { start: startTime, end: endTime },
      );
      conflicts.push(...lawyerConflicts);
    }

    if (checkTypes.includes(ConflictType.COURT_ROOM)) {
      const courtConflicts = await this.detectCourtRoomConflict(
        dto.caseId,
        dto.hearingId,
        dto.courtRoomId,
        { start: startTime, end: endTime },
      );
      conflicts.push(...courtConflicts);
    }

    if (checkTypes.includes(ConflictType.JUDGE_TIME)) {
      const judgeConflicts = await this.detectJudgeTimeConflict(
        dto.caseId,
        dto.hearingId,
        { start: startTime, end: endTime },
      );
      conflicts.push(...judgeConflicts);
    }

    if (checkTypes.includes(ConflictType.CLIENT_CONFLICT)) {
      const clientConflicts = await this.detectClientConflict(
        dto.caseId,
        dto.hearingId,
      );
      conflicts.push(...clientConflicts);
    }

    if (checkTypes.includes(ConflictType.CASE_CONFLICT)) {
      const caseConflicts = await this.detectCaseConflict(
        dto.caseId,
        dto.hearingId,
      );
      conflicts.push(...caseConflicts);
    }

    return conflicts;
  }

  private async detectLawyerTimeConflict(
    caseId: string,
    hearingId: string | undefined,
    timeRange: TimeOverlap,
  ): Promise<ConflictCheck[]> {
    const conflicts: ConflictCheck[] = [];

    const caseData = await this.prisma.case.findUnique({
      where: { id: caseId },
      select: {
        lawyerInChargeId: true,
        lawyerInCharge: { select: { realName: true } },
        assistantInChargeId: true,
        assistantInCharge: { select: { realName: true } },
      },
    });

    if (!caseData) return conflicts;

    const lawyerIds = [caseData.lawyerInChargeId, caseData.assistantInChargeId]
      .filter((id): id is string => !!id);

    if (lawyerIds.length === 0) return conflicts;

    const overlappedHearings = await this.prisma.hearing.findMany({
      where: {
        id: hearingId ? { not: hearingId } : undefined,
        status: { in: [HearingStatus.SCHEDULED, HearingStatus.CONFIRMED, HearingStatus.IN_PROGRESS] },
        startTime: { lt: timeRange.end },
        endTime: { gt: timeRange.start },
        assignments: {
          some: {
            assigneeId: { in: lawyerIds },
          },
        },
      },
      include: {
        assignments: {
          where: { assigneeId: { in: lawyerIds } },
          include: { assignee: { select: { realName: true } } },
        },
        caseInfo: { select: { caseNo: true, title: true } },
      },
    });

    for (const hearing of overlappedHearings) {
      for (const assignment of hearing.assignments) {
        const currentName = assignment.assignee.realName;
        const currentLawyer = caseData.lawyerInCharge?.realName === currentName
          ? caseData.lawyerInChargeId
          : caseData.assistantInCharge?.realName === currentName
            ? caseData.assistantInChargeId
            : assignment.assigneeId;

        const conflict: ConflictCheck = {
          id: '',
          hearingId: hearingId || '',
          conflictType: ConflictType.LAWYER_TIME,
          severity: ConflictSeverity.HIGH,
          description: `律师【${currentName}】在同一时间段（${timeRange.start.toISOString()} ~ ${timeRange.end.toISOString()}）已安排另一开庭【${hearing.caseInfo?.caseNo} - ${hearing.caseInfo?.title}】`,
          involvedPartyA: currentLawyer,
          involvedPartyB: hearing.id,
          partyAType: 'LAWYER',
          partyBType: 'HEARING',
          partyAName: currentName,
          partyBName: `${hearing.caseInfo?.caseNo} - ${hearing.caseInfo?.title}`,
          caseId: caseId,
          partyAClientId: null,
          partyBClientId: null,
          isResolved: false,
          resolvedAt: null,
          resolvedBy: null,
          resolution: null,
          createdAt: new Date(),
        };
        conflicts.push(conflict);
      }
    }

    return conflicts;
  }

  private async detectCourtRoomConflict(
    caseId: string,
    hearingId: string | undefined,
    courtRoomId: string,
    timeRange: TimeOverlap,
  ): Promise<ConflictCheck[]> {
    const conflicts: ConflictCheck[] = [];

    const overlappedHearings = await this.prisma.hearing.findMany({
      where: {
        id: hearingId ? { not: hearingId } : undefined,
        courtRoomId,
        status: { in: [HearingStatus.SCHEDULED, HearingStatus.CONFIRMED, HearingStatus.IN_PROGRESS] },
        startTime: { lt: timeRange.end },
        endTime: { gt: timeRange.start },
      },
      include: {
        caseInfo: { select: { caseNo: true, title: true } },
        courtRoom: { include: { court: { select: { name: true } } } },
      },
    });

    for (const hearing of overlappedHearings) {
      const roomName = `${hearing.courtRoom.court.name} - ${hearing.courtRoom.roomName || hearing.courtRoom.roomNo}`;
      const conflict: ConflictCheck = {
        id: '',
        hearingId: hearingId || '',
        conflictType: ConflictType.COURT_ROOM,
        severity: ConflictSeverity.HIGH,
        description: `法庭【${roomName}】在同一时间段（${timeRange.start.toISOString()} ~ ${timeRange.end.toISOString()}）已被另一开庭【${hearing.caseInfo?.caseNo} - ${hearing.caseInfo?.title}】占用`,
        involvedPartyA: courtRoomId,
        involvedPartyB: hearing.id,
        partyAType: 'COURT_ROOM',
        partyBType: 'HEARING',
        partyAName: roomName,
        partyBName: `${hearing.caseInfo?.caseNo} - ${hearing.caseInfo?.title}`,
        caseId: caseId,
        partyAClientId: null,
        partyBClientId: null,
        isResolved: false,
        resolvedAt: null,
        resolvedBy: null,
        resolution: null,
        createdAt: new Date(),
      };
      conflicts.push(conflict);
    }

    return conflicts;
  }

  private async detectJudgeTimeConflict(
    caseId: string,
    hearingId: string | undefined,
    timeRange: TimeOverlap,
  ): Promise<ConflictCheck[]> {
    const conflicts: ConflictCheck[] = [];

    if (hearingId) {
      const currentHearing = await this.prisma.hearing.findUnique({
        where: { id: hearingId },
        select: {
          presidingJudgeId: true,
          presidingJudge: { select: { name: true } },
          judges: {
            include: { judge: { select: { name: true } } },
          },
        },
      });

      if (!currentHearing?.presidingJudgeId) return conflicts;

      const judgeIds = [
        currentHearing.presidingJudgeId,
        ...currentHearing.judges.map(j => j.judgeId),
      ];

      const overlappedHearings = await this.prisma.hearing.findMany({
        where: {
          id: { not: hearingId },
          status: { in: [HearingStatus.SCHEDULED, HearingStatus.CONFIRMED, HearingStatus.IN_PROGRESS] },
          startTime: { lt: timeRange.end },
          endTime: { gt: timeRange.start },
          OR: [
            { presidingJudgeId: { in: judgeIds } },
            { judges: { some: { judgeId: { in: judgeIds } } } },
          ],
        },
        include: {
          presidingJudge: { select: { name: true } },
          caseInfo: { select: { caseNo: true, title: true } },
        },
      });

      for (const hearing of overlappedHearings) {
        const judgeName = hearing.presidingJudge?.name || '法官';
        const conflict: ConflictCheck = {
          id: '',
          hearingId: hearingId || '',
          conflictType: ConflictType.JUDGE_TIME,
          severity: ConflictSeverity.HIGH,
          description: `法官【${judgeName}】在同一时间段（${timeRange.start.toISOString()} ~ ${timeRange.end.toISOString()}）已安排另一开庭【${hearing.caseInfo?.caseNo} - ${hearing.caseInfo?.title}】`,
          involvedPartyA: hearing.presidingJudgeId,
          involvedPartyB: hearing.id,
          partyAType: 'JUDGE',
          partyBType: 'HEARING',
          partyAName: judgeName,
          partyBName: `${hearing.caseInfo?.caseNo} - ${hearing.caseInfo?.title}`,
          caseId: caseId,
          partyAClientId: null,
          partyBClientId: null,
          isResolved: false,
          resolvedAt: null,
          resolvedBy: null,
          resolution: null,
          createdAt: new Date(),
        };
        conflicts.push(conflict);
      }
    }

    return conflicts;
  }

  private async detectClientConflict(
    caseId: string,
    hearingId: string | undefined,
  ): Promise<ConflictCheck[]> {
    const conflicts: ConflictCheck[] = [];

    const caseData = await this.prisma.case.findUnique({
      where: { id: caseId },
      select: {
        ownerClientId: true,
        ownerClient: { select: { name: true } },
        caseClients: {
          include: { client: { select: { name: true } } },
        },
        lawyerInChargeId: true,
      },
    });

    if (!caseData || !caseData.lawyerInChargeId) return conflicts;

    const clientIds = [
      caseData.ownerClientId,
      ...caseData.caseClients.map(cc => cc.clientId),
    ];

    const activeCases = await this.prisma.case.findMany({
      where: {
        id: { not: caseId },
        status: { in: ['PENDING', 'ACTIVE'] },
        lawyerInChargeId: caseData.lawyerInChargeId,
        OR: [
          { ownerClientId: { in: clientIds } },
          { caseClients: { some: { clientId: { in: clientIds } } } },
        ],
      },
      include: {
        ownerClient: { select: { name: true } },
        caseClients: { include: { client: { select: { name: true } } } },
      },
    });

    for (const activeCase of activeCases) {
      const conflict: ConflictCheck = {
        id: '',
        hearingId: hearingId || '',
        conflictType: ConflictType.CLIENT_CONFLICT,
        severity: ConflictSeverity.CRITICAL,
        description: `同一主办律师正在代理存在客户利益冲突的案件：当前案件客户与【${activeCase.caseNo} - ${activeCase.title}】存在重叠客户`,
        involvedPartyA: caseId,
        involvedPartyB: activeCase.id,
        partyAType: 'CASE',
        partyBType: 'CASE',
        partyAName: caseData.ownerClient?.name,
        partyBName: activeCase.ownerClient?.name,
        caseId: caseId,
        partyAClientId: caseData.ownerClientId,
        partyBClientId: activeCase.ownerClientId,
        isResolved: false,
        resolvedAt: null,
        resolvedBy: null,
        resolution: null,
        createdAt: new Date(),
      };
      conflicts.push(conflict);
    }

    return conflicts;
  }

  private async detectCaseConflict(
    caseId: string,
    hearingId: string | undefined,
  ): Promise<ConflictCheck[]> {
    const conflicts: ConflictCheck[] = [];

    const caseData = await this.prisma.case.findUnique({
      where: { id: caseId },
      select: {
        caseNo: true,
        title: true,
        ownerClientId: true,
        ownerClient: { select: { name: true } },
        caseClients: {
          include: { client: { select: { id: true, name: true } } },
        },
      },
    });

    if (!caseData) return conflicts;

    const clientIds = new Set([
      caseData.ownerClientId,
      ...caseData.caseClients.map(cc => cc.clientId),
    ]);

    const activeCaseClients = await this.prisma.caseClient.findMany({
      where: {
        clientId: { in: Array.from(clientIds) },
        case: { status: { in: ['PENDING', 'ACTIVE'] } },
      },
      include: {
        case: {
          select: {
            id: true,
            caseNo: true,
            title: true,
            ownerClientId: true,
          },
        },
      },
    });

    const opposingMap = new Map<string, Set<string>>();

    for (const cc of activeCaseClients) {
      const otherCaseClients = await this.prisma.caseClient.findMany({
        where: { caseId: cc.caseId },
        include: { client: { select: { name: true } } },
      });

      const caseClientIds = otherCaseClients.map(c => c.clientId);
      const hasCurrentClient = caseClientIds.some(id => clientIds.has(id));

      if (hasCurrentClient) {
        if (!opposingMap.has(cc.caseId)) {
          opposingMap.set(cc.caseId, new Set());
        }
      }
    }

    for (const [otherCaseId] of opposingMap) {
      if (otherCaseId === caseId) continue;

      const otherCase = await this.prisma.case.findUnique({
        where: { id: otherCaseId },
        select: {
          caseNo: true,
          title: true,
          caseClients: {
            include: { client: { select: { name: true } } },
          },
        },
      });

      if (otherCase) {
        const currentClients = caseData.caseClients.map(c => c.client.name).join(', ') || caseData.ownerClient?.name;
        const otherClients = otherCase.caseClients.map(c => c.client.name).join(', ');

        const conflict: ConflictCheck = {
          id: '',
          hearingId: hearingId || '',
          conflictType: ConflictType.CASE_CONFLICT,
          severity: ConflictSeverity.HIGH,
          description: `案件对立冲突：当前案件【${caseData.caseNo}】的当事人【${currentClients}】与【${otherCase.caseNo}】的当事人【${otherClients}】存在对立利益`,
          involvedPartyA: caseId,
          involvedPartyB: otherCaseId,
          partyAType: 'CASE',
          partyBType: 'CASE',
          partyAName: caseData.caseNo,
          partyBName: otherCase.caseNo,
          caseId: caseId,
          partyAClientId: caseData.ownerClientId,
          partyBClientId: otherCaseId,
          isResolved: false,
          resolvedAt: null,
          resolvedBy: null,
          resolution: null,
          createdAt: new Date(),
        };
        conflicts.push(conflict);
      }
    }

    return conflicts;
  }

  async autoCreateConflicts(hearingId: string, dto: DetectConflictDto): Promise<ConflictCheck[]> {
    const detected = await this.detect(dto);
    const created: ConflictCheck[] = [];

    for (const conflict of detected) {
      const exists = await this.prisma.conflictCheck.findFirst({
        where: {
          hearingId: conflict.hearingId || hearingId,
          conflictType: conflict.conflictType,
          involvedPartyA: conflict.involvedPartyA,
          involvedPartyB: conflict.involvedPartyB,
          isResolved: false,
        },
      });

      if (!exists) {
        const newConflict = await this.prisma.conflictCheck.create({
          data: {
            hearingId: conflict.hearingId || hearingId,
            conflictType: conflict.conflictType,
            severity: conflict.severity,
            description: conflict.description,
            involvedPartyA: conflict.involvedPartyA,
            involvedPartyB: conflict.involvedPartyB,
            partyAType: conflict.partyAType,
            partyBType: conflict.partyBType,
            partyAName: conflict.partyAName,
            partyBName: conflict.partyBName,
            caseId: conflict.caseId,
            partyAClientId: conflict.partyAClientId,
            partyBClientId: conflict.partyBClientId,
          },
          include: {
            hearing: true,
            case: true,
          },
        });
        created.push(newConflict);
      }
    }

    this.logger.log(`Auto-created ${created.length} conflicts for hearing ${hearingId}`);
    return created;
  }

  async getConflictStats(): Promise<{
    total: number;
    unresolved: number;
    byType: Record<string, number>;
    bySeverity: Record<string, number>;
  }> {
    const total = await this.prisma.conflictCheck.count();
    const unresolved = await this.prisma.conflictCheck.count({ where: { isResolved: false } });

    const typeAggregates = await this.prisma.conflictCheck.groupBy({
      by: ['conflictType'],
      _count: true,
    });

    const severityAggregates = await this.prisma.conflictCheck.groupBy({
      by: ['severity'],
      _count: true,
    });

    const byType: Record<string, number> = {};
    for (const agg of typeAggregates) {
      byType[agg.conflictType] = agg._count;
    }

    const bySeverity: Record<string, number> = {};
    for (const agg of severityAggregates) {
      bySeverity[agg.severity] = agg._count;
    }

    return {
      total,
      unresolved,
      byType,
      bySeverity,
    };
  }
}
