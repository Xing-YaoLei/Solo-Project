import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateExceptionDto } from './dto/create-exception.dto';
import { UpdateExceptionDto } from './dto/update-exception.dto';
import { QueryExceptionDto } from './dto/query-exception.dto';
import { CreateTimelineDto } from './dto/timeline.dto';
import { buildPaginatedResult } from '../../common/dto/pagination.dto';
import { ExceptionStatus, Prisma } from '@prisma/client';

@Injectable()
export class ExceptionService {
  constructor(private readonly prisma: PrismaService) {}

  private generateExceptionNo(): string {
    const now = new Date();
    const timestamp = now.getFullYear().toString() +
      (now.getMonth() + 1).toString().padStart(2, '0') +
      now.getDate().toString().padStart(2, '0') +
      now.getHours().toString().padStart(2, '0') +
      now.getMinutes().toString().padStart(2, '0') +
      now.getSeconds().toString().padStart(2, '0');
    const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
    return `EX-${timestamp}-${random}`;
  }

  async create(createExceptionDto: CreateExceptionDto, creatorId: string) {
    const exceptionNo = this.generateExceptionNo();

    const creator = await this.prisma.user.findUnique({
      where: { id: creatorId },
      select: { realName: true },
    });
    const operatorName = creator?.realName || '系统';

    const data: any = {
      exceptionNo,
      ...createExceptionDto,
      impactScope: createExceptionDto.impactScope as Prisma.InputJsonValue,
      responsibility: createExceptionDto.responsibility as Prisma.InputJsonValue,
      creatorId,
      relatedConflictIds: createExceptionDto.relatedConflictIds || [],
      relatedHearingIds: createExceptionDto.relatedHearingIds || [],
      timeline: {
        create: {
          action: '创建',
          description: `创建异常单：${createExceptionDto.title}`,
          operatorName,
          operatorId: creatorId,
          statusChange: `-> ${ExceptionStatus.OPEN}`,
        },
      },
    };

    if (createExceptionDto.estimatedLoss !== undefined) {
      data.estimatedLoss = new Prisma.Decimal(createExceptionDto.estimatedLoss);
    }
    if (createExceptionDto.actualLoss !== undefined) {
      data.actualLoss = new Prisma.Decimal(createExceptionDto.actualLoss);
    }

    return this.prisma.exceptionRecord.create({
      data,
      include: {
        creator: { select: { id: true, realName: true, username: true } },
        resolver: { select: { id: true, realName: true } },
        hearing: { select: { id: true, hearingNo: true, startTime: true } },
        case: { select: { id: true, caseNo: true, title: true } },
        timeline: { orderBy: { createdAt: 'asc' } },
        attachments: true,
      },
    });
  }

  async findAll(query: QueryExceptionDto) {
    const {
      page = 1,
      limit = 20,
      exceptionNo,
      hearingId,
      caseId,
      exceptionType,
      severity,
      status,
      creatorId,
      resolverId,
      createdAtFrom,
      createdAtTo,
      keyword,
    } = query;

    const where: any = {};
    if (exceptionNo) where.exceptionNo = { contains: exceptionNo };
    if (hearingId) where.hearingId = hearingId;
    if (caseId) where.caseId = caseId;
    if (exceptionType) where.exceptionType = exceptionType;
    if (severity) where.severity = severity;
    if (status) where.status = status;
    if (creatorId) where.creatorId = creatorId;
    if (resolverId) where.resolverId = resolverId;
    if (createdAtFrom || createdAtTo) {
      where.createdAt = {};
      if (createdAtFrom) where.createdAt.gte = new Date(createdAtFrom);
      if (createdAtTo) where.createdAt.lte = new Date(createdAtTo);
    }
    if (keyword) {
      where.OR = [
        { title: { contains: keyword } },
        { description: { contains: keyword } },
      ];
    }

    const [list, total] = await Promise.all([
      this.prisma.exceptionRecord.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          creator: { select: { id: true, realName: true } },
          resolver: { select: { id: true, realName: true } },
          hearing: { select: { id: true, hearingNo: true, startTime: true } },
          case: { select: { id: true, caseNo: true, title: true } },
          _count: {
            select: { timeline: true, attachments: true },
          },
        },
      }),
      this.prisma.exceptionRecord.count({ where }),
    ]);

    return buildPaginatedResult(list, total, page, limit);
  }

  async findOne(id: string) {
    const exception = await this.prisma.exceptionRecord.findUnique({
      where: { id },
      include: {
        creator: { select: { id: true, realName: true, username: true, email: true, phone: true } },
        resolver: { select: { id: true, realName: true, username: true, email: true, phone: true } },
        hearing: {
          include: {
            caseInfo: { select: { id: true, caseNo: true, title: true } },
            court: { select: { id: true, name: true } },
            courtRoom: { select: { id: true, roomNo: true, roomName: true } },
          },
        },
        case: {
          include: {
            ownerClient: { select: { id: true, name: true, clientNo: true } },
            lawyerInCharge: { select: { id: true, realName: true } },
          },
        },
        timeline: {
          orderBy: { createdAt: 'asc' },
          include: {
            exception: { select: { id: true, exceptionNo: true } },
          },
        },
        attachments: true,
      },
    });

    if (!exception) {
      throw new NotFoundException('异常单不存在');
    }

    return exception;
  }

  async update(id: string, updateExceptionDto: UpdateExceptionDto, operatorId?: string) {
    const exception = await this.prisma.exceptionRecord.findUnique({ where: { id } });
    if (!exception) {
      throw new NotFoundException('异常单不存在');
    }

    const { resolverId, status, ...restData } = updateExceptionDto;

    const data: any = {
      ...restData,
    };

    if (restData.impactScope !== undefined) {
      data.impactScope = restData.impactScope as Prisma.InputJsonValue;
    }
    if (restData.responsibility !== undefined) {
      data.responsibility = restData.responsibility as Prisma.InputJsonValue;
    }
    if (restData.estimatedLoss !== undefined) {
      data.estimatedLoss = new Prisma.Decimal(restData.estimatedLoss);
    }
    if (restData.actualLoss !== undefined) {
      data.actualLoss = new Prisma.Decimal(restData.actualLoss);
    }

    let statusChangeStr: string | null = null;
    if (status && status !== exception.status) {
      data.status = status;
      statusChangeStr = `${exception.status} -> ${status}`;

      if (status === ExceptionStatus.RESOLVED) {
        data.resolvedAt = new Date();
        data.resolverId = resolverId || operatorId;
      }
      if (status === ExceptionStatus.CLOSED) {
        data.closedAt = new Date();
        if (!exception.resolvedAt) {
          data.resolvedAt = new Date();
          data.resolverId = resolverId || operatorId;
        }
      }
    } else if (resolverId) {
      data.resolverId = resolverId;
    }

    const timelineData: any = {};
    if (operatorId) {
      const operator = await this.prisma.user.findUnique({
        where: { id: operatorId },
        select: { realName: true },
      });
      const operatorName = operator?.realName || '系统';

      const timelineEntries = [];
      if (statusChangeStr) {
        timelineEntries.push({
          action: '状态变更',
          description: `异常单状态变更`,
          operatorName,
          operatorId,
          statusChange: statusChangeStr,
        });
      }
      if (Object.keys(restData).length > 0) {
        timelineEntries.push({
          action: '更新',
          description: '更新异常单信息',
          operatorName,
          operatorId,
        });
      }

      if (timelineEntries.length > 0) {
        data.timeline = {
          create: timelineEntries,
        };
      }
    }

    return this.prisma.exceptionRecord.update({
      where: { id },
      data,
      include: {
        creator: { select: { id: true, realName: true } },
        resolver: { select: { id: true, realName: true } },
        timeline: { orderBy: { createdAt: 'desc' }, take: 10 },
      },
    });
  }

  async remove(id: string) {
    const exception = await this.prisma.exceptionRecord.findUnique({ where: { id } });
    if (!exception) {
      throw new NotFoundException('异常单不存在');
    }

    if (exception.status !== ExceptionStatus.OPEN && exception.status !== ExceptionStatus.CLOSED) {
      throw new BadRequestException('仅待处理或已关闭状态的异常单可以删除');
    }

    return this.prisma.exceptionRecord.delete({ where: { id } });
  }

  async addTimeline(createTimelineDto: CreateTimelineDto) {
    const exception = await this.prisma.exceptionRecord.findUnique({
      where: { id: createTimelineDto.exceptionId },
    });
    if (!exception) {
      throw new NotFoundException('异常单不存在');
    }

    let operatorName = createTimelineDto.operatorName;
    if (!operatorName && createTimelineDto.operatorId) {
      const operator = await this.prisma.user.findUnique({
        where: { id: createTimelineDto.operatorId },
        select: { realName: true },
      });
      operatorName = operator?.realName || '系统';
    }

    return this.prisma.exceptionTimeline.create({
      data: {
        ...createTimelineDto,
        operatorName: operatorName || '系统',
        metadata: createTimelineDto.metadata as Prisma.InputJsonValue,
      },
    });
  }

  async getTimeline(exceptionId: string) {
    const exception = await this.prisma.exceptionRecord.findUnique({
      where: { id: exceptionId },
    });
    if (!exception) {
      throw new NotFoundException('异常单不存在');
    }

    return this.prisma.exceptionTimeline.findMany({
      where: { exceptionId },
      orderBy: { createdAt: 'asc' },
    });
  }

  async getExceptionStats(caseId?: string, hearingId?: string) {
    const where: any = {};
    if (caseId) where.caseId = caseId;
    if (hearingId) where.hearingId = hearingId;

    const statuses = [
      ExceptionStatus.OPEN,
      ExceptionStatus.INVESTIGATING,
      ExceptionStatus.RESOLVED,
      ExceptionStatus.CLOSED,
      ExceptionStatus.ESCALATED,
    ];

    const counts = await Promise.all(
      statuses.map((s) =>
        this.prisma.exceptionRecord.count({ where: { ...where, status: s } }),
      ),
    );

    const statusStats: any = {};
    statuses.forEach((s, i) => {
      statusStats[s] = counts[i];
    });

    const typeStats = await this.prisma.exceptionRecord.groupBy({
      by: ['exceptionType'],
      where,
      _count: { id: true },
    });

    const severityStats = await this.prisma.exceptionRecord.groupBy({
      by: ['severity'],
      where,
      _count: { id: true },
    });

    return {
      total: counts.reduce((a, b) => a + b, 0),
      statusStats,
      typeStats: typeStats.map((t) => ({
        type: t.exceptionType,
        count: t._count.id,
      })),
      severityStats: severityStats.map((s) => ({
        severity: s.severity,
        count: s._count.id,
      })),
    };
  }

  async escalateException(id: string, operatorId: string, description?: string) {
    const exception = await this.prisma.exceptionRecord.findUnique({ where: { id } });
    if (!exception) {
      throw new NotFoundException('异常单不存在');
    }

    if (exception.status === ExceptionStatus.ESCALATED) {
      throw new BadRequestException('异常单已处于升级状态');
    }

    const operator = await this.prisma.user.findUnique({
      where: { id: operatorId },
      select: { realName: true },
    });
    const operatorName = operator?.realName || '系统';

    return this.prisma.exceptionRecord.update({
      where: { id },
      data: {
        status: ExceptionStatus.ESCALATED,
        timeline: {
          create: {
            action: '升级',
            description: description || '异常单已升级处理',
            operatorName,
            operatorId,
            statusChange: `${exception.status} -> ${ExceptionStatus.ESCALATED}`,
          },
        },
      },
      include: {
        timeline: { orderBy: { createdAt: 'desc' }, take: 5 },
      },
    });
  }
}
