import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { nanoid } from 'nanoid';

export interface CreateExceptionInput {
  activityId?: string;
  orderId?: string;
  type: string;
  title: string;
  description: string;
  severity?: string;
  impactScope: string;
  affectedOrders?: string[];
  affectedSeats?: any[];
  liabilityParty?: string;
  liabilityDetail?: string;
  handlerId?: string;
  handlerName?: string;
  deadline?: Date;
}

@Injectable()
export class ExceptionService {
  constructor(private prisma: PrismaService) {}

  async list(query: {
    activityId?: string;
    status?: string;
    type?: string;
    keyword?: string;
    page?: number;
    pageSize?: number;
  }) {
    const { activityId, status, type, keyword, page = 1, pageSize = 20 } = query;
    const where: any = {};
    if (activityId) where.activityId = activityId;
    if (status) where.status = status;
    if (type) where.type = type;
    if (keyword) {
      where.OR = [
        { exceptionNo: { contains: keyword } },
        { title: { contains: keyword } },
        { description: { contains: keyword } },
      ];
    }
    const [list, total] = await Promise.all([
      this.prisma.exceptionRecord.findMany({
        where,
        skip: (page - 1) * pageSize,
        take: pageSize,
        orderBy: [{ createdAt: 'desc' }],
        include: {
          order: { select: { orderNo: true, customerName: true, customerPhone: true } },
          activity: { select: { name: true } },
        },
      }),
      this.prisma.exceptionRecord.count({ where }),
    ]);
    return { list, total, page, pageSize };
  }

  async findOne(id: string) {
    return this.prisma.exceptionRecord.findUnique({
      where: { id },
      include: {
        order: true,
        activity: true,
      },
    });
  }

  async create(input: CreateExceptionInput) {
    const exceptionNo = `EXC-${new Date().getFullYear()}-${nanoid(4).toUpperCase()}`;

    const result = await this.prisma.exceptionRecord.create({
      data: {
        exceptionNo,
        activityId: input.activityId || null,
        orderId: input.orderId || null,
        type: input.type as any,
        title: input.title,
        description: input.description,
        status: 'OPEN',
        severity: input.severity || 'MEDIUM',
        impactScope: input.impactScope,
        affectedOrders: input.affectedOrders || null,
        affectedSeats: input.affectedSeats || null,
        liabilityParty: (input.liabilityParty as any) || 'UNCLEAR',
        liabilityDetail: input.liabilityDetail || null,
        handlerId: input.handlerId || null,
        handlerName: input.handlerName || null,
        deadline: input.deadline || null,
      },
    });

    if (input.orderId) {
      await this.prisma.order.update({
        where: { id: input.orderId },
        data: { status: 'DISPUTED' },
      });
    }

    return result;
  }

  async update(id: string, data: any) {
    const existing = await this.prisma.exceptionRecord.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('异常单不存在');
    return this.prisma.exceptionRecord.update({ where: { id }, data });
  }

  async updateStatus(id: string, status: string, resolution?: string, handlingResult?: string, resolutionDetail?: any) {
    const existing = await this.prisma.exceptionRecord.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('异常单不存在');
    const allowed = ['OPEN', 'INVESTIGATING', 'PENDING_RESPONSE', 'RESOLVED', 'CLOSED', 'ESCALATED'];
    if (!allowed.includes(status)) throw new BadRequestException(`不支持的状态 ${status}`);

    const data: any = { status: status as any };
    if (resolution) data.resolution = resolution;
    if (handlingResult) data.handlingResult = handlingResult;
    if (resolutionDetail) data.resolutionDetail = resolutionDetail;
    if (status === 'CLOSED' || status === 'RESOLVED') data.closedAt = new Date();

    return this.prisma.exceptionRecord.update({ where: { id }, data });
  }

  async updateLiability(id: string, liabilityParty: string, liabilityDetail?: string) {
    const existing = await this.prisma.exceptionRecord.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('异常单不存在');
    const allowed = ['CUSTOMER', 'PLATFORM', 'VENUE', 'ORGANIZER', 'THIRD_PARTY', 'UNCLEAR'];
    if (!allowed.includes(liabilityParty)) throw new BadRequestException('不支持的责任方');

    return this.prisma.exceptionRecord.update({
      where: { id },
      data: {
        liabilityParty: liabilityParty as any,
        liabilityDetail: liabilityDetail || existing.liabilityDetail,
      },
    });
  }

  async assign(id: string, handlerId: string, handlerName: string) {
    const existing = await this.prisma.exceptionRecord.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('异常单不存在');

    return this.prisma.exceptionRecord.update({
      where: { id },
      data: { handlerId, handlerName },
    });
  }
}
