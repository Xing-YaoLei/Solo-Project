import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';
import { ComplaintStatus, Priority } from '@prisma/client';
import { CreateComplaintDto } from './dto/create-complaint.dto';
import { UpdateComplaintDto } from './dto/update-complaint.dto';
import { AssignComplaintDto, ReassignComplaintDto } from './dto/assign-complaint.dto';
import { QueryComplaintDto } from './dto/query-complaint.dto';
import { VisitResultDto } from './dto/visit-result.dto';
import { SupplementMaterialDto, RejectComplaintDto, UpgradeComplaintDto } from './dto/supplement-material.dto';

@Injectable()
export class ComplaintsService {
  constructor(private prisma: PrismaService) {}

  private async generateComplaintCode(): Promise<string> {
    const today = new Date();
    const dateStr = `${today.getFullYear()}${String(today.getMonth() + 1).padStart(2, '0')}${String(today.getDate()).padStart(2, '0')}`;
    const last = await this.prisma.complaint.findFirst({
      where: { code: { startsWith: `CP${dateStr}` } },
      orderBy: { code: 'desc' },
    });
    let seq = 1;
    if (last) {
      seq = parseInt(last.code.slice(-4)) + 1;
    }
    return `CP${dateStr}${String(seq).padStart(4, '0')}`;
  }

  private async writeOperationLog(complaintId: string, operator: any, action: string, detail?: string) {
    return this.prisma.operationLog.create({
      data: {
        complaintId,
        operatorId: operator.id,
        operatorName: operator.name,
        action,
        detail,
      },
    });
  }

  async findAll(query: QueryComplaintDto, _user: any) {
    const { keyword, status, priority, source, departmentId, ownerId, tagId, dateFrom, dateTo, sortBy = 'createdAt', sortOrder = 'desc', page = 1, pageSize = 20 } = query;
    const skip = (page - 1) * pageSize;

    const where: any = {};

    if (keyword) {
      where.OR = [
        { title: { contains: keyword } },
        { content: { contains: keyword } },
        { code: { contains: keyword } },
        { visitorName: { contains: keyword } },
      ];
    }
    if (status) where.status = status;
    if (priority) where.priority = priority;
    if (source) where.source = source;
    if (departmentId) where.departmentId = departmentId;
    if (ownerId) where.ownerId = ownerId;
    if (tagId) {
      where.tags = { some: { id: tagId } };
    }
    if (dateFrom) where.createdAt = { ...(where.createdAt || {}), gte: new Date(dateFrom) };
    if (dateTo) where.createdAt = { ...(where.createdAt || {}), lte: new Date(dateTo) };

    const orderBy: any = {};
    orderBy[sortBy] = sortOrder;

    const [total, items] = await Promise.all([
      this.prisma.complaint.count({ where }),
      this.prisma.complaint.findMany({
        where,
        skip,
        take: pageSize,
        include: {
          owner: { select: { id: true, name: true, role: true } },
          department: true,
          tags: true,
          assignments: { include: { toUser: { select: { id: true, name: true } }, fromUser: { select: { id: true, name: true } } } },
        },
        orderBy: [orderBy],
      }),
    ]);

    const totalPages = Math.ceil(total / pageSize);
    return { items, total, page, pageSize, totalPages };
  }

  async findOne(id: string, _user: any) {
    const complaint = await this.prisma.complaint.findUnique({
      where: { id },
      include: {
        owner: { select: { id: true, name: true, role: true, phone: true } },
        department: true,
        tags: true,
        assignments: {
          include: {
            toUser: { select: { id: true, name: true, role: true } },
            fromUser: { select: { id: true, name: true, role: true } },
          },
          orderBy: { createdAt: 'desc' },
        },
        upgradeRecords: {
          include: { operator: { select: { id: true, name: true } } },
          orderBy: { createdAt: 'desc' },
        },
        visitResult: { include: { operator: { select: { id: true, name: true } } } },
        operationLogs: {
          include: { operator: { select: { id: true, name: true } } },
          orderBy: { createdAt: 'desc' },
        },
        attachments: true,
      },
    });
    if (!complaint) {
      throw new NotFoundException('投诉工单不存在');
    }
    return complaint;
  }

  async create(dto: CreateComplaintDto, user: any) {
    const code = await this.generateComplaintCode();
    const complaint = await this.prisma.complaint.create({
      data: {
        code,
        title: dto.title,
        content: dto.content,
        source: dto.source,
        priority: dto.priority || Priority.MEDIUM,
        visitorName: dto.visitorName,
        visitorPhone: dto.visitorPhone,
        visitorIdCard: dto.visitorIdCard,
        ticketNo: dto.ticketNo,
        location: dto.location,
        deadlineAt: new Date(dto.deadlineAt),
        tags: dto.tagIds ? { connect: dto.tagIds.map((id) => ({ id })) } : undefined,
      },
      include: { tags: true },
    });

    await this.writeOperationLog(complaint.id, user, 'CREATE', `创建工单：${dto.title}`);
    return complaint;
  }

  async update(id: string, dto: UpdateComplaintDto, user: any) {
    const existing = await this.prisma.complaint.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundException('投诉工单不存在');
    }

    const { tagIds, deadlineAt, ...rest } = dto;
    const data: any = { ...rest };
    if (deadlineAt) data.deadlineAt = new Date(deadlineAt);
    if (tagIds) {
      data.tags = { set: tagIds.map((tid) => ({ id: tid })) };
    }

    const complaint = await this.prisma.complaint.update({
      where: { id },
      data,
      include: { tags: true },
    });

    await this.writeOperationLog(id, user, 'UPDATE', '更新工单信息');
    return complaint;
  }

  async remove(id: string, user: any) {
    const existing = await this.prisma.complaint.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundException('投诉工单不存在');
    }
    await this.prisma.complaint.delete({ where: { id } });
    await this.writeOperationLog(id, user, 'DELETE', '删除工单');
  }

  async assign(id: string, dto: AssignComplaintDto, user: any) {
    const existing = await this.prisma.complaint.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundException('投诉工单不存在');
    }

    const toUser = await this.prisma.user.findUnique({ where: { id: dto.toUserId } });
    if (!toUser) {
      throw new BadRequestException('目标处理人不存在');
    }

    const complaint = await this.prisma.complaint.update({
      where: { id },
      data: {
        status: ComplaintStatus.ASSIGNED,
        ownerId: dto.toUserId,
        departmentId: dto.departmentId || toUser.departmentId,
        assignments: {
          create: {
            fromUserId: user.id,
            toUserId: dto.toUserId,
            reason: dto.reason,
          },
        },
      },
      include: { owner: true, assignments: true },
    });

    await this.writeOperationLog(id, user, 'ASSIGN', `分派给 ${toUser.name} 处理，原因：${dto.reason || '常规分派'}`);
    return complaint;
  }

  async reassign(id: string, dto: ReassignComplaintDto, user: any) {
    const existing = await this.prisma.complaint.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundException('投诉工单不存在');
    }

    const toUser = await this.prisma.user.findUnique({ where: { id: dto.toUserId } });
    if (!toUser) {
      throw new BadRequestException('目标处理人不存在');
    }

    const complaint = await this.prisma.complaint.update({
      where: { id },
      data: {
        status: ComplaintStatus.ASSIGNED,
        ownerId: dto.toUserId,
        departmentId: dto.departmentId || toUser.departmentId,
        assignments: {
          create: {
            fromUserId: user.id,
            toUserId: dto.toUserId,
            reason: dto.reason || '转派',
          },
        },
      },
      include: { owner: true, assignments: true },
    });

    await this.writeOperationLog(id, user, 'REASSIGN', `转派给 ${toUser.name}，原因：${dto.reason || '转派'}`);
    return complaint;
  }

  async reject(id: string, dto: RejectComplaintDto, user: any) {
    const existing = await this.prisma.complaint.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundException('投诉工单不存在');
    }

    const complaint = await this.prisma.complaint.update({
      where: { id },
      data: { status: ComplaintStatus.REJECTED },
    });

    await this.writeOperationLog(id, user, 'REJECT', `驳回：${dto.reason}`);
    return complaint;
  }

  async upgrade(id: string, dto: UpgradeComplaintDto, user: any) {
    const existing = await this.prisma.complaint.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundException('投诉工单不存在');
    }

    const toLevel = dto.toLevel as Priority;
    if (!Object.values(Priority).includes(toLevel)) {
      throw new BadRequestException('无效的优先级');
    }

    const complaint = await this.prisma.complaint.update({
      where: { id },
      data: {
        priority: toLevel,
        upgradeRecords: {
          create: {
            fromLevel: existing.priority,
            toLevel,
            operatorId: user.id,
            reason: dto.reason,
          },
        },
      },
      include: { upgradeRecords: true },
    });

    await this.writeOperationLog(id, user, 'UPGRADE', `优先级从 ${existing.priority} 升级为 ${toLevel}，原因：${dto.reason}`);
    return complaint;
  }

  async supplement(id: string, dto: SupplementMaterialDto, user: any) {
    const existing = await this.prisma.complaint.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundException('投诉工单不存在');
    }

    const complaint = await this.prisma.complaint.update({
      where: { id },
      data: {
        status: ComplaintStatus.SUPPLEMENTING,
        content: existing.content + '\n\n补充材料：' + dto.content,
      },
    });

    await this.writeOperationLog(id, user, 'SUPPLEMENT', `补充材料：${dto.content.substring(0, 100)}`);
    return complaint;
  }

  async visit(id: string, dto: VisitResultDto, user: any) {
    const existing = await this.prisma.complaint.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundException('投诉工单不存在');
    }

    const existingVisit = await this.prisma.visitResult.findUnique({ where: { complaintId: id } });
    if (existingVisit) {
      throw new BadRequestException('该工单已存在回访记录');
    }

    const complaint = await this.prisma.complaint.update({
      where: { id },
      data: {
        status: ComplaintStatus.VISITING,
        visitResult: {
          create: {
            operatorId: user.id,
            satisfaction: dto.satisfaction,
            feedback: dto.feedback,
            needFollowUp: dto.needFollowUp,
            visitedAt: new Date(dto.visitedAt),
          },
        },
      },
      include: { visitResult: true },
    });

    await this.writeOperationLog(id, user, 'VISIT', `完成回访，满意度：${dto.satisfaction} 分`);
    return complaint;
  }

  async close(id: string, user: any) {
    const existing = await this.prisma.complaint.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundException('投诉工单不存在');
    }

    const now = new Date();
    const closeDurationMinutes = Math.floor((now.getTime() - existing.createdAt.getTime()) / 60000);

    const complaint = await this.prisma.complaint.update({
      where: { id },
      data: {
        status: ComplaintStatus.CLOSED,
        closedAt: now,
        closeDurationMinutes,
      },
    });

    await this.writeOperationLog(id, user, 'CLOSE', `关闭工单，处理耗时 ${closeDurationMinutes} 分钟`);
    return complaint;
  }
}
