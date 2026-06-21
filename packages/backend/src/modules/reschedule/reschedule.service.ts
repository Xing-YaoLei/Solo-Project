import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateRescheduleDto } from './dto/create-reschedule.dto';
import { UpdateRescheduleDto } from './dto/update-reschedule.dto';
import { QueryRescheduleDto } from './dto/query-reschedule.dto';
import { ApproveRescheduleDto } from './dto/approve-reschedule.dto';
import { RescheduleRecord, HearingStatus, UserRole } from '@prisma/client';
import { buildPaginatedResult, PaginatedResultDto } from '../../common/dto/pagination.dto';

export interface AffectedParty {
  id: string;
  name: string;
  type: 'LAWYER' | 'CLIENT' | 'JUDGE' | 'OTHER';
  role?: string;
  contactPhone?: string | null;
  contactEmail?: string | null;
}

@Injectable()
export class RescheduleService {
  private readonly logger = new Logger(RescheduleService.name);

  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateRescheduleDto): Promise<RescheduleRecord> {
    const originalHearing = await this.prisma.hearing.findUnique({
      where: { id: dto.originalHearingId },
      include: {
        caseInfo: true,
        court: true,
        courtRoom: true,
      },
    });

    if (!originalHearing) {
      throw new NotFoundException(`Original hearing not found: ${dto.originalHearingId}`);
    }

    if (originalHearing.status === HearingStatus.COMPLETED
        || originalHearing.status === HearingStatus.CANCELLED
        || originalHearing.status === HearingStatus.RESCHEDULED) {
      throw new BadRequestException(
        `Cannot reschedule hearing with status ${originalHearing.status}`,
      );
    }

    const affectedParties = await this.getAffectedParties(dto.originalHearingId);

    return this.prisma.rescheduleRecord.create({
      data: {
        originalHearingId: dto.originalHearingId,
        rescheduledHearingId: dto.rescheduledHearingId,
        oldStartTime: originalHearing.startTime,
        oldEndTime: originalHearing.endTime,
        newStartTime: dto.newStartTime ? new Date(dto.newStartTime) : null,
        newEndTime: dto.newEndTime ? new Date(dto.newEndTime) : null,
        reason: dto.reason,
        reasonDetail: dto.reasonDetail,
        initiatedBy: dto.initiatedBy,
        affectedParties: affectedParties as any,
        notes: dto.notes,
      },
      include: {
        originalHearing: {
          include: {
            caseInfo: true,
            court: true,
            courtRoom: true,
          },
        },
        rescheduledHearing: true,
      },
    });
  }

  async findAll(dto: QueryRescheduleDto): Promise<PaginatedResultDto<RescheduleRecord>> {
    const page = dto.page || 1;
    const limit = dto.limit || 20;
    const skip = (page - 1) * limit;

    const where: Record<string, any> = {};

    if (dto.originalHearingId) where.originalHearingId = dto.originalHearingId;
    if (dto.rescheduledHearingId) where.rescheduledHearingId = dto.rescheduledHearingId;
    if (dto.reason) where.reason = dto.reason;
    if (dto.isApproved !== undefined) where.isApproved = dto.isApproved;
    if (dto.initiatedBy) where.initiatedBy = dto.initiatedBy;
    if (dto.approverId) where.approverId = dto.approverId;

    if (dto.startDate || dto.endDate) {
      where.createdAt = {};
      if (dto.startDate) where.createdAt.gte = new Date(dto.startDate);
      if (dto.endDate) where.createdAt.lte = new Date(dto.endDate);
    }

    if (dto.keyword) {
      where.OR = [
        { reasonDetail: { contains: dto.keyword, mode: 'insensitive' } },
        { notes: { contains: dto.keyword, mode: 'insensitive' } },
      ];
    }

    const [list, total] = await Promise.all([
      this.prisma.rescheduleRecord.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          originalHearing: {
            include: {
              caseInfo: true,
              court: true,
              courtRoom: true,
            },
          },
          rescheduledHearing: {
            include: {
              caseInfo: true,
              court: true,
              courtRoom: true,
            },
          },
        },
      }),
      this.prisma.rescheduleRecord.count({ where }),
    ]);

    return buildPaginatedResult(list, total, page, limit);
  }

  async findOne(id: string): Promise<RescheduleRecord> {
    const record = await this.prisma.rescheduleRecord.findUnique({
      where: { id },
      include: {
        originalHearing: {
          include: {
            caseInfo: true,
            court: true,
            courtRoom: true,
            assignments: {
              include: {
                assignee: {
                  select: {
                    id: true,
                    realName: true,
                    phone: true,
                    email: true,
                    role: true,
                  },
                },
              },
            },
            attendance: true,
          },
        },
        rescheduledHearing: {
          include: {
            caseInfo: true,
            court: true,
            courtRoom: true,
          },
        },
      },
    });

    if (!record) {
      throw new NotFoundException(`Reschedule record not found: ${id}`);
    }

    return record;
  }

  async update(id: string, dto: UpdateRescheduleDto): Promise<RescheduleRecord> {
    const record = await this.findOne(id);

    if (record.isApproved) {
      throw new BadRequestException('Cannot update an already approved reschedule request');
    }

    return this.prisma.rescheduleRecord.update({
      where: { id },
      data: {
        reason: dto.reason,
        reasonDetail: dto.reasonDetail,
        newStartTime: dto.newStartTime ? new Date(dto.newStartTime) : undefined,
        newEndTime: dto.newEndTime ? new Date(dto.newEndTime) : undefined,
        rescheduledHearingId: dto.rescheduledHearingId,
        notes: dto.notes,
        notificationStatus: dto.notificationStatus,
      },
      include: {
        originalHearing: {
          include: {
            caseInfo: true,
            court: true,
            courtRoom: true,
          },
        },
        rescheduledHearing: true,
      },
    });
  }

  async remove(id: string): Promise<void> {
    const record = await this.findOne(id);

    if (record.isApproved) {
      throw new BadRequestException('Cannot delete an already approved reschedule request');
    }

    await this.prisma.rescheduleRecord.delete({ where: { id } });
  }

  async approve(id: string, dto: ApproveRescheduleDto): Promise<RescheduleRecord> {
    const record = await this.findOne(id);

    if (record.isApproved) {
      throw new BadRequestException('This reschedule request has already been approved');
    }

    const approver = await this.prisma.user.findUnique({
      where: { id: dto.approverId },
      select: {
        id: true,
        role: true,
        realName: true,
      },
    });

    if (!approver) {
      throw new NotFoundException(`Approver not found: ${dto.approverId}`);
    }

    const allowedRoles: UserRole[] = [UserRole.ADMIN, UserRole.CLERK];
    if (!allowedRoles.includes(approver.role)) {
      throw new BadRequestException(
        `User with role ${approver.role} is not authorized to approve reschedule requests`,
      );
    }

    return this.prisma.$transaction(async (tx) => {
      if (dto.approved) {
        await tx.hearing.update({
          where: { id: record.originalHearingId },
          data: {
            status: HearingStatus.RESCHEDULED,
          },
        });

        if (record.rescheduledHearingId) {
          await tx.hearing.update({
            where: { id: record.rescheduledHearingId },
            data: {
              status: HearingStatus.SCHEDULED,
            },
          });
        }
      }

      if (dto.approverNotes) {
        await tx.statusTimeline.create({
          data: {
            hearingId: record.originalHearingId,
            previousStatus: undefined,
            newStatus: dto.approved ? 'RESCHEDULED' : 'SCHEDULED',
            changeType: dto.approved ? '改约审批通过' : '改约审批拒绝',
            description: dto.approverNotes,
            operatorId: dto.approverId,
            operatorName: approver.realName,
            changeReason: record.reason,
          },
        });
      }

      const updated = await tx.rescheduleRecord.update({
        where: { id },
        data: {
          isApproved: dto.approved,
          approverId: dto.approverId,
          approvedAt: new Date(),
          notes: dto.approverNotes
            ? (record.notes ? `${record.notes}\n审批意见：${dto.approverNotes}` : `审批意见：${dto.approverNotes}`)
            : record.notes,
        },
        include: {
          originalHearing: {
            include: {
              caseInfo: true,
              court: true,
              courtRoom: true,
            },
          },
          rescheduledHearing: {
            include: {
              caseInfo: true,
              court: true,
              courtRoom: true,
            },
          },
        },
      });

      this.logger.log(
        `Reschedule ${id} ${dto.approved ? 'approved' : 'rejected'} by ${approver.realName}`,
      );

      return updated;
    });
  }

  async getAffectedParties(hearingId: string): Promise<AffectedParty[]> {
    const parties: AffectedParty[] = [];

    const hearing = await this.prisma.hearing.findUnique({
      where: { id: hearingId },
      include: {
        assignments: {
          include: {
            assignee: {
              select: {
                id: true,
                realName: true,
                phone: true,
                email: true,
                role: true,
              },
            },
          },
        },
        caseInfo: {
          include: {
            ownerClient: {
              select: {
                id: true,
                name: true,
                contactPhone: true,
                contactEmail: true,
              },
            },
            caseClients: {
              include: {
                client: {
                  select: {
                    id: true,
                    name: true,
                    contactPhone: true,
                    contactEmail: true,
                  },
                },
              },
            },
            lawyerInCharge: {
              select: {
                id: true,
                realName: true,
                phone: true,
                email: true,
              },
            },
            assistantInCharge: {
              select: {
                id: true,
                realName: true,
                phone: true,
                email: true,
              },
            },
          },
        },
        presidingJudge: {
          select: {
            id: true,
            name: true,
            phone: true,
            email: true,
          },
        },
        judges: {
          include: {
            judge: {
              select: {
                id: true,
                name: true,
                phone: true,
                email: true,
              },
            },
          },
        },
      },
    });

    if (!hearing) {
      return parties;
    }

    const addedIds = new Set<string>();

    if (hearing.caseInfo?.lawyerInCharge && !addedIds.has(hearing.caseInfo.lawyerInCharge.id)) {
      addedIds.add(hearing.caseInfo.lawyerInCharge.id);
      parties.push({
        id: hearing.caseInfo.lawyerInCharge.id,
        name: hearing.caseInfo.lawyerInCharge.realName,
        type: 'LAWYER',
        role: '主办律师',
        contactPhone: hearing.caseInfo.lawyerInCharge.phone,
        contactEmail: hearing.caseInfo.lawyerInCharge.email,
      });
    }

    if (hearing.caseInfo?.assistantInCharge && !addedIds.has(hearing.caseInfo.assistantInCharge.id)) {
      addedIds.add(hearing.caseInfo.assistantInCharge.id);
      parties.push({
        id: hearing.caseInfo.assistantInCharge.id,
        name: hearing.caseInfo.assistantInCharge.realName,
        type: 'LAWYER',
        role: '协办律师',
        contactPhone: hearing.caseInfo.assistantInCharge.phone,
        contactEmail: hearing.caseInfo.assistantInCharge.email,
      });
    }

    for (const assignment of hearing.assignments) {
      if (!addedIds.has(assignment.assignee.id)) {
        addedIds.add(assignment.assignee.id);
        parties.push({
          id: assignment.assignee.id,
          name: assignment.assignee.realName,
          type: 'LAWYER',
          role: assignment.role,
          contactPhone: assignment.assignee.phone,
          contactEmail: assignment.assignee.email,
        });
      }
    }

    if (hearing.presidingJudge && !addedIds.has(`judge-${hearing.presidingJudge.id}`)) {
      addedIds.add(`judge-${hearing.presidingJudge.id}`);
      parties.push({
        id: hearing.presidingJudge.id,
        name: hearing.presidingJudge.name,
        type: 'JUDGE',
        role: '审判长',
        contactPhone: hearing.presidingJudge.phone,
        contactEmail: hearing.presidingJudge.email,
      });
    }

    for (const judgeAssignment of hearing.judges) {
      const judgeKey = `judge-${judgeAssignment.judgeId}`;
      if (!addedIds.has(judgeKey)) {
        addedIds.add(judgeKey);
        parties.push({
          id: judgeAssignment.judgeId,
          name: judgeAssignment.judge.name,
          type: 'JUDGE',
          role: judgeAssignment.role,
          contactPhone: judgeAssignment.judge.phone,
          contactEmail: judgeAssignment.judge.email,
        });
      }
    }

    if (hearing.caseInfo?.ownerClient && !addedIds.has(`client-${hearing.caseInfo.ownerClient.id}`)) {
      addedIds.add(`client-${hearing.caseInfo.ownerClient.id}`);
      parties.push({
        id: hearing.caseInfo.ownerClient.id,
        name: hearing.caseInfo.ownerClient.name,
        type: 'CLIENT',
        role: '委托方',
        contactPhone: hearing.caseInfo.ownerClient.contactPhone,
        contactEmail: hearing.caseInfo.ownerClient.contactEmail,
      });
    }

    if (hearing.caseInfo?.caseClients) {
      for (const cc of hearing.caseInfo.caseClients) {
        const clientKey = `client-${cc.clientId}`;
        if (!addedIds.has(clientKey)) {
          addedIds.add(clientKey);
          parties.push({
            id: cc.clientId,
            name: cc.client.name,
            type: 'CLIENT',
            role: cc.roleInCase,
            contactPhone: cc.client.contactPhone,
            contactEmail: cc.client.contactEmail,
          });
        }
      }
    }

    return parties;
  }

  async linkRescheduledHearing(
    rescheduleId: string,
    newHearingId: string,
  ): Promise<RescheduleRecord> {
    const record = await this.findOne(rescheduleId);

    const newHearing = await this.prisma.hearing.findUnique({
      where: { id: newHearingId },
    });

    if (!newHearing) {
      throw new NotFoundException(`New hearing not found: ${newHearingId}`);
    }

    if (newHearing.caseId !== record.originalHearing.caseId) {
      throw new BadRequestException('New hearing must belong to the same case');
    }

    return this.prisma.rescheduleRecord.update({
      where: { id: rescheduleId },
      data: {
        rescheduledHearingId: newHearingId,
        newStartTime: newHearing.startTime,
        newEndTime: newHearing.endTime,
      },
      include: {
        originalHearing: {
          include: {
            caseInfo: true,
            court: true,
            courtRoom: true,
          },
        },
        rescheduledHearing: {
          include: {
            caseInfo: true,
            court: true,
            courtRoom: true,
          },
        },
      },
    });
  }

  async getRescheduleHistory(hearingId: string): Promise<RescheduleRecord[]> {
    const records = await this.prisma.rescheduleRecord.findMany({
      where: {
        OR: [
          { originalHearingId: hearingId },
          { rescheduledHearingId: hearingId },
        ],
      },
      orderBy: { createdAt: 'asc' },
      include: {
        originalHearing: {
          include: {
            caseInfo: true,
            court: true,
            courtRoom: true,
          },
        },
        rescheduledHearing: {
          include: {
            caseInfo: true,
            court: true,
            courtRoom: true,
          },
        },
      },
    });

    return records;
  }

  async getRescheduleStats(): Promise<{
    total: number;
    pending: number;
    approved: number;
    byReason: Record<string, number>;
  }> {
    const total = await this.prisma.rescheduleRecord.count();
    const pending = await this.prisma.rescheduleRecord.count({ where: { isApproved: false } });
    const approved = await this.prisma.rescheduleRecord.count({ where: { isApproved: true } });

    const reasonAggregates = await this.prisma.rescheduleRecord.groupBy({
      by: ['reason'],
      _count: true,
    });

    const byReason: Record<string, number> = {};
    for (const agg of reasonAggregates) {
      byReason[agg.reason] = agg._count;
    }

    return {
      total,
      pending,
      approved,
      byReason,
    };
  }
}
