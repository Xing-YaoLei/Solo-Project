import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { RedisService } from '../redis/redis.service';
import { TimelineService } from '../timeline/timeline.service';
import { CreateConflictCheckDto, ArchiveConflictCheckDto } from './dto/conflict-check.dto';
import { CaseStatus, TimelineEventType } from '@legal/shared';

@Injectable()
export class ConflictCheckService {
  constructor(
    private prisma: PrismaService,
    private redis: RedisService,
    private timelineService: TimelineService,
  ) {}

  async performCheck(caseId: string, userId: string) {
    const caseData = await this.prisma.case.findUnique({
      where: { id: caseId },
    });
    if (!caseData) {
      throw new NotFoundException(`Case ${caseId} not found`);
    }

    const opposingName = caseData.opposingPartyName;
    const opposingId = caseData.opposingPartyIdNumber;

    const conflictingCases = await this.prisma.case.findMany({
      where: {
        id: { not: caseId },
        status: { not: CaseStatus.CASE_ARCHIVED },
        OR: [
          { opposingPartyName: opposingName },
          ...(opposingId ? [{ opposingPartyIdNumber: opposingId }] : []),
        ],
      },
      select: { id: true, title: true, opposingPartyName: true },
    });

    const hasConflict = conflictingCases.length > 0;
    const conflictingCaseIds = conflictingCases.map((c) => c.id);
    const conflictDetails = hasConflict
      ? `发现利益冲突: 与案件 ${conflictingCases.map((c) => c.title).join(', ')} 存在冲突`
      : null;

    const check = await this.prisma.conflictCheck.create({
      data: {
        caseId,
        checkedBy: userId,
        hasConflict,
        conflictDetails,
        conflictingCaseIds,
      },
    });

    const operator = await this.prisma.user.findUnique({ where: { id: userId } });

    if (hasConflict) {
      await this.prisma.case.update({
        where: { id: caseId },
        data: { status: CaseStatus.CONFLICT_FAILED },
      });

      await this.timelineService.addEvent({
        caseId,
        eventType: TimelineEventType.CONFLICT_CHECK_FAILED,
        title: '利益冲突检查未通过',
        content: conflictDetails!,
        operatorId: userId,
        operatorName: operator?.name || '',
      });
    } else {
      await this.prisma.case.update({
        where: { id: caseId },
        data: { status: CaseStatus.CONFLICT_PASSED },
      });

      await this.timelineService.addEvent({
        caseId,
        eventType: TimelineEventType.CONFLICT_CHECK_PASSED,
        title: '利益冲突检查通过',
        content: '未发现利益冲突，案件可以继续推进',
        operatorId: userId,
        operatorName: operator?.name || '',
      });
    }

    await this.redis.set(
      `conflict:case:${caseId}`,
      JSON.stringify({
        hasConflict,
        conflictingCaseIds,
        checkedAt: check.checkedAt,
      }),
      86400,
    );

    return check;
  }

  async findAll(caseId: string) {
    const caseData = await this.prisma.case.findUnique({ where: { id: caseId } });
    if (!caseData) {
      throw new NotFoundException(`Case ${caseId} not found`);
    }

    return this.prisma.conflictCheck.findMany({
      where: { caseId },
      orderBy: { checkedAt: 'desc' },
    });
  }

  async archive(id: string, dto: ArchiveConflictCheckDto) {
    const check = await this.prisma.conflictCheck.findUnique({ where: { id } });
    if (!check) {
      throw new NotFoundException(`Conflict check ${id} not found`);
    }

    return this.prisma.conflictCheck.update({
      where: { id },
      data: {
        archivedAt: new Date(),
        archivePath: dto.archivePath,
      },
    });
  }
}
