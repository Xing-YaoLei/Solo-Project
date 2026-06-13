import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { TimelineService } from '../timeline/timeline.service';
import { ResponsibilityRuleService } from '../responsibility-rule/responsibility-rule.service';
import { RefundStatus, TimelineAction, ResponsibilityParty } from '@prisma/client';
import {
  CreateRefundOrderDto,
  UpdateRefundOrderDto,
  AssignOrderDto,
  UpdateStatusDto,
  AddEvidenceDto,
  AddNoteDto,
  RetryOrderDto,
  SupplementOrderDto,
  CloseOrderDto,
  RefundFilterParams,
  RefundStats,
} from '@solo/shared';

@Injectable()
export class RefundOrderService {
  constructor(
    private prisma: PrismaService,
    private timeline: TimelineService,
    private ruleService: ResponsibilityRuleService,
  ) {}

  private includeRelations() {
    return {
      assignee: { select: { id: true, name: true, role: true, region: true } },
      createdBy: { select: { id: true, name: true } },
      evidences: { include: { uploadedBy: { select: { id: true, name: true } } }, orderBy: { createdAt: 'desc' as const } },
    } as any;
  }

  async findAll(params: RefundFilterParams) {
    const { page = 1, pageSize = 20, ...filters } = params;
    const where: any = {};

    if (filters.status?.length) where.status = { in: filters.status };
    if (filters.startDate) where.createdAt = { ...where.createdAt, gte: filters.startDate };
    if (filters.endDate) where.createdAt = { ...where.createdAt, lte: filters.endDate };
    if (filters.region) where.region = filters.region;
    if (filters.assigneeId) where.assigneeId = filters.assigneeId;
    if (filters.problemTag) where.problemTags = { has: filters.problemTag };
    if (filters.responsibility) where.responsibility = filters.responsibility;
    if (filters.isTimeout !== undefined) where.isTimeout = filters.isTimeout;
    if (filters.keyword) {
      where.OR = [
        { orderNo: { contains: filters.keyword } },
        { customerName: { contains: filters.keyword } },
        { customerPhone: { contains: filters.keyword } },
        { productName: { contains: filters.keyword } },
        { reason: { contains: filters.keyword } },
      ];
    }

    const [total, items] = await Promise.all([
      this.prisma.refundOrder.count({ where }),
      this.prisma.refundOrder.findMany({
        where,
        include: this.includeRelations(),
        skip: (page - 1) * pageSize,
        take: pageSize,
        orderBy: [
          { isUrgent: 'desc' as const },
          { isTimeout: 'desc' as const },
          { deadline: 'asc' as const },
          { createdAt: 'desc' as const },
        ],
      }),
    ]);

    return { total, page, pageSize, items };
  }

  async findOne(id: string) {
    const order = await this.prisma.refundOrder.findUnique({
      where: { id },
      include: {
        ...this.includeRelations(),
        timelines: {
          include: { operator: { select: { id: true, name: true, role: true } } },
          orderBy: { createdAt: 'desc' as const },
        },
        reminders: {
          include: { recipient: { select: { id: true, name: true } } },
          orderBy: { sentAt: 'desc' as const },
        },
      } as any,
    });
    if (!order) throw new NotFoundException('售后单不存在');
    return order;
  }

  async create(data: CreateRefundOrderDto, operatorId?: string) {
    const deadline = new Date(data.deadline);
    if (deadline <= new Date()) {
      throw new BadRequestException('处理时限必须晚于当前时间');
    }

    const order = await this.prisma.refundOrder.create({
      data: {
        ...data,
        deadline,
        createdById: operatorId,
      } as any,
      include: this.includeRelations(),
    });

    await this.timeline.record({
      refundOrderId: order.id,
      action: TimelineAction.CREATED,
      newStatus: order.status,
      note: '售后单创建',
      operatorId,
    });

    const ruleResult = await this.ruleService.matchRule({
      problemTags: order.problemTags,
      visitResult: order.visitResult,
      region: order.region,
    });

    if (ruleResult.responsibility || ruleResult.assigneeId) {
      const updateData: any = {};
      if (ruleResult.responsibility) updateData.responsibility = ruleResult.responsibility;
      if (ruleResult.assigneeId) {
        updateData.assigneeId = ruleResult.assigneeId;
        updateData.status = RefundStatus.ASSIGNED;
      }

      const updated = await this.prisma.refundOrder.update({
        where: { id: order.id },
        data: updateData,
        include: this.includeRelations(),
      });

      if (ruleResult.responsibility) {
        await this.timeline.record({
          refundOrderId: order.id,
          action: TimelineAction.RESPONSIBILITY_ASSIGNED,
          newValue: ruleResult.responsibility,
          note: `根据规则「${ruleResult.matchedRuleName}」自动判定责任`,
          operatorId,
        });
      }

      if (ruleResult.assigneeId) {
        await this.timeline.record({
          refundOrderId: order.id,
          action: TimelineAction.ASSIGNED,
          newValue: ruleResult.assigneeId,
          note: `根据规则「${ruleResult.matchedRuleName}」自动分配`,
          operatorId,
        });
      }

      return updated;
    }

    return order;
  }

  async update(id: string, data: UpdateRefundOrderDto, operatorId?: string) {
    const existing = await this.findOne(id);
    const oldStatus = existing.status;

    const updated = await this.prisma.refundOrder.update({
      where: { id },
      data,
      include: this.includeRelations(),
    });

    if (data.status && data.status !== oldStatus) {
      await this.timeline.record({
        refundOrderId: id,
        action: TimelineAction.STATUS_CHANGED,
        oldStatus,
        newStatus: data.status,
        note: data.note || `状态变更`,
        operatorId,
      });
    }

    if (data.responsibility && data.responsibility !== existing.responsibility) {
      await this.timeline.record({
        refundOrderId: id,
        action: TimelineAction.RESPONSIBILITY_ASSIGNED,
        oldValue: existing.responsibility,
        newValue: data.responsibility,
        note: '责任归属变更',
        operatorId,
      });
    }

    return updated;
  }

  async assign(id: string, data: AssignOrderDto, operatorId?: string) {
    const existing = await this.findOne(id);

    const updated = await this.prisma.refundOrder.update({
      where: { id },
      data: {
        assigneeId: data.assigneeId,
        status: RefundStatus.ASSIGNED,
      },
      include: this.includeRelations(),
    });

    await this.timeline.record({
      refundOrderId: id,
      action: TimelineAction.ASSIGNED,
      oldValue: existing.assigneeId,
      newValue: data.assigneeId,
      note: data.note || '人工分配处理人',
      operatorId,
    });

    return updated;
  }

  async updateStatus(id: string, data: UpdateStatusDto, operatorId?: string) {
    const existing = await this.findOne(id);

    if (existing.status === RefundStatus.CLOSED) {
      throw new BadRequestException('已关闭的售后单无法变更状态');
    }

    const updated = await this.prisma.refundOrder.update({
      where: { id },
      data: { status: data.status },
      include: this.includeRelations(),
    });

    await this.timeline.record({
      refundOrderId: id,
      action: TimelineAction.STATUS_CHANGED,
      oldStatus: existing.status,
      newStatus: data.status,
      note: data.note,
      operatorId,
    });

    return updated;
  }

  async addEvidence(id: string, data: AddEvidenceDto, operatorId: string) {
    await this.findOne(id);

    const evidence = await this.prisma.refundEvidence.create({
      data: {
        ...data,
        refundOrderId: id,
        uploadedById: operatorId,
      } as any,
      include: { uploadedBy: { select: { id: true, name: true } } },
    });

    await this.timeline.record({
      refundOrderId: id,
      action: TimelineAction.EVIDENCE_UPLOADED,
      newValue: evidence.fileName,
      note: data.note,
      operatorId,
    });

    const order = await this.prisma.refundOrder.update({
      where: { id },
      data: { status: RefundStatus.EVIDENCE_UPLOADED },
      include: this.includeRelations(),
    });

    return { evidence, order };
  }

  async deleteEvidence(id: string, evidenceId: string, operatorId?: string) {
    const evidence = await this.prisma.refundEvidence.findUnique({
      where: { id: evidenceId },
    });
    if (!evidence || evidence.refundOrderId !== id) {
      throw new NotFoundException('附件不存在');
    }

    await this.prisma.refundEvidence.delete({ where: { id: evidenceId } });

    await this.timeline.record({
      refundOrderId: id,
      action: TimelineAction.EVIDENCE_DELETED,
      oldValue: evidence.fileName,
      note: '删除附件',
      operatorId,
    });

    return { success: true };
  }

  async addNote(id: string, data: AddNoteDto, operatorId?: string) {
    await this.timeline.record({
      refundOrderId: id,
      action: data.action || TimelineAction.NOTE_ADDED,
      note: data.note,
      operatorId,
    });

    return this.findOne(id);
  }

  async retry(id: string, data: RetryOrderDto, operatorId?: string) {
    const existing = await this.findOne(id);
    if (existing.status === RefundStatus.CLOSED) {
      throw new BadRequestException('已关闭的售后单无法重试');
    }

    const updateData: any = { status: RefundStatus.RETRY };
    if (data.newDeadline) {
      updateData.deadline = data.newDeadline;
    }

    const updated = await this.prisma.refundOrder.update({
      where: { id },
      data: updateData,
      include: this.includeRelations(),
    });

    await this.timeline.record({
      refundOrderId: id,
      action: TimelineAction.RETRY_REQUESTED,
      oldStatus: existing.status,
      newStatus: RefundStatus.RETRY,
      note: data.reason,
      operatorId,
    });

    return updated;
  }

  async supplement(id: string, data: SupplementOrderDto, operatorId?: string) {
    const existing = await this.findOne(id);
    if (existing.status === RefundStatus.CLOSED) {
      throw new BadRequestException('已关闭的售后单无法补录');
    }

    const updateData: any = { status: RefundStatus.SUPPLEMENT };
    if (data.newDeadline) {
      updateData.deadline = data.newDeadline;
    }

    const updated = await this.prisma.refundOrder.update({
      where: { id },
      data: updateData,
      include: this.includeRelations(),
    });

    await this.timeline.record({
      refundOrderId: id,
      action: TimelineAction.SUPPLEMENT_REQUESTED,
      oldStatus: existing.status,
      newStatus: RefundStatus.SUPPLEMENT,
      note: `${data.reason}\n需要补充: ${data.requiredInfo}`,
      operatorId,
    });

    return updated;
  }

  async close(id: string, data: CloseOrderDto, operatorId?: string) {
    const existing = await this.findOne(id);
    if (existing.status === RefundStatus.CLOSED) {
      throw new BadRequestException('售后单已关闭');
    }

    const now = new Date();
    const handlingDuration = existing.createdAt
      ? Math.round((now.getTime() - existing.createdAt.getTime()) / 60000)
      : null;

    const updated = await this.prisma.refundOrder.update({
      where: { id },
      data: {
        status: RefundStatus.CLOSED,
        actualClosedAt: now,
        handlingDurationMinutes: handlingDuration,
        refundAmount: data.finalAmount ?? existing.refundAmount,
      },
      include: this.includeRelations(),
    });

    await this.timeline.record({
      refundOrderId: id,
      action: TimelineAction.CLOSED,
      oldStatus: existing.status,
      newStatus: RefundStatus.CLOSED,
      note: `售后关闭。结果: ${data.result}${data.finalAmount ? `, 最终退款: ¥${data.finalAmount}` : ''}`,
      operatorId,
    });

    return updated;
  }

  async reopen(id: string, reason: string, operatorId?: string) {
    const existing = await this.findOne(id);
    if (existing.status !== RefundStatus.CLOSED) {
      throw new BadRequestException('只有已关闭的售后单可以重新打开');
    }

    const updated = await this.prisma.refundOrder.update({
      where: { id },
      data: {
        status: RefundStatus.PROCESSING,
        actualClosedAt: null,
        handlingDurationMinutes: null,
      },
      include: this.includeRelations(),
    });

    await this.timeline.record({
      refundOrderId: id,
      action: TimelineAction.REOPENED,
      oldStatus: RefundStatus.CLOSED,
      newStatus: RefundStatus.PROCESSING,
      note: reason,
      operatorId,
    });

    return updated;
  }

  async getStats(): Promise<RefundStats> {
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    const [total, pending, processing, closed, timeout, avgDuration, totalAmount] = await Promise.all([
      this.prisma.refundOrder.count(),
      this.prisma.refundOrder.count({ where: { status: { in: [RefundStatus.PENDING, RefundStatus.ASSIGNED] } } }),
      this.prisma.refundOrder.count({ where: { status: { in: [RefundStatus.PROCESSING, RefundStatus.EVIDENCE_UPLOADED, RefundStatus.REVIEWING, RefundStatus.RETRY, RefundStatus.SUPPLEMENT] } } }),
      this.prisma.refundOrder.count({ where: { status: RefundStatus.CLOSED } }),
      this.prisma.refundOrder.count({ where: { isTimeout: true } }),
      this.prisma.refundOrder.aggregate({
        _avg: { handlingDurationMinutes: true },
        where: { status: RefundStatus.CLOSED, createdAt: { gte: thirtyDaysAgo } },
      }),
      this.prisma.refundOrder.aggregate({
        _sum: { refundAmount: true },
        where: { createdAt: { gte: thirtyDaysAgo } },
      }),
    ]);

    return {
      total,
      pending,
      processing,
      closed,
      timeout,
      avgHandlingHours: avgDuration._avg.handlingDurationMinutes ? Math.round(avgDuration._avg.handlingDurationMinutes / 60 * 10) / 10 : 0,
      totalRefundAmount: totalAmount._sum.refundAmount ? Number(totalAmount._sum.refundAmount) : 0,
    };
  }

  async getKanbanData() {
    const statuses = [
      RefundStatus.PENDING,
      RefundStatus.ASSIGNED,
      RefundStatus.PROCESSING,
      RefundStatus.EVIDENCE_UPLOADED,
      RefundStatus.REVIEWING,
      RefundStatus.RETRY,
      RefundStatus.SUPPLEMENT,
      RefundStatus.CLOSED,
    ];

    const result = await Promise.all(
      statuses.map(async (status) => {
        const orders = await this.prisma.refundOrder.findMany({
          where: { status },
          include: this.includeRelations(),
          orderBy: [{ isUrgent: 'desc' }, { deadline: 'asc' }],
          take: 50,
        });
        return { status, orders };
      }),
    );

    return Object.fromEntries(result.map((r) => [r.status, r.orders]));
  }

  async markTimeout(id: string, operatorId?: string) {
    const existing = await this.findOne(id);
    
    const updated = await this.prisma.refundOrder.update({
      where: { id },
      data: {
        isTimeout: true,
        timeoutCount: { increment: 1 },
        status: RefundStatus.TIMEOUT,
      },
      include: this.includeRelations(),
    });

    await this.timeline.record({
      refundOrderId: id,
      action: TimelineAction.TIMEOUT,
      oldStatus: existing.status,
      newStatus: RefundStatus.TIMEOUT,
      note: '处理超时',
      operatorId,
    });

    return updated;
  }

  async markTimeoutWarning(id: string, operatorId?: string) {
    await this.timeline.record({
      refundOrderId: id,
      action: TimelineAction.TIMEOUT_WARNING,
      note: '即将超时提醒',
      operatorId,
    });
  }
}
