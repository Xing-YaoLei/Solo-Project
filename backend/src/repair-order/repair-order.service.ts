import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { RedisService } from '../redis/redis.service';
import {
  CreateRepairOrderDto,
  AssignOrderDto,
  UpdateStatusDto,
  AddDelayRecordDto,
  AddMaterialDto,
  CreateSignoffDto,
  UpdateReviewTagsDto,
  QueryOrdersDto,
  CloseOrderDto,
} from './dto/repair-order.dto';
import { OrderStatus, ReviewTag } from '@prisma/client';

@Injectable()
export class RepairOrderService {
  constructor(
    private prisma: PrismaService,
    private redis: RedisService,
  ) {}

  generateOrderNo(): string {
    const date = new Date();
    const dateStr = date.toISOString().slice(0, 10).replace(/-/g, '');
    const random = Math.random().toString(36).substring(2, 8).toUpperCase();
    return `WX${dateStr}${random}`;
  }

  async create(dto: CreateRepairOrderDto) {
    const orderNo = this.generateOrderNo();
    
    const order = await this.prisma.repairOrder.create({
      data: {
        ...dto,
        orderNo,
        status: OrderStatus.CREATED,
        planStartTime: dto.planStartTime ? new Date(dto.planStartTime) : undefined,
        planEndTime: dto.planEndTime ? new Date(dto.planEndTime) : undefined,
      },
      include: {
        assignPerson: true,
        delayRecords: true,
        routePlans: true,
        statusLogs: true,
        materials: {
          include: {
            material: true,
          },
        },
        signoffProof: true,
      },
    });

    await this.redis.del('orders:active');

    return order;
  }

  async findAll(query: QueryOrdersDto) {
    const { status, source, assignPersonId, page = 1, pageSize = 20, keyword } = query;
    const skip = (page - 1) * pageSize;

    const where: any = {};
    if (status) where.status = status;
    if (source) where.source = source;
    if (assignPersonId) where.assignPersonId = assignPersonId;
    if (keyword) {
      where.OR = [
        { orderNo: { contains: keyword } },
        { apartmentNo: { contains: keyword } },
        { tenantName: { contains: keyword } },
        { faultDesc: { contains: keyword } },
      ];
    }

    const [list, total] = await Promise.all([
      this.prisma.repairOrder.findMany({
        where,
        skip,
        take: pageSize,
        orderBy: { createdAt: 'desc' },
        include: {
          assignPerson: true,
          delayRecords: true,
          routePlans: true,
        },
      }),
      this.prisma.repairOrder.count({ where }),
    ]);

    return { list, total, page, pageSize };
  }

  async findOne(id: string) {
    const order = await this.prisma.repairOrder.findUnique({
      where: { id },
      include: {
        assignPerson: true,
        delayRecords: {
          orderBy: { createdAt: 'desc' },
        },
        routePlans: {
          orderBy: { sequence: 'asc' },
        },
        statusLogs: {
          orderBy: { createdAt: 'desc' },
          take: 20,
        },
        materials: {
          include: {
            material: true,
          },
        },
        signoffProof: true,
      },
    });

    if (!order) {
      throw new NotFoundException('派单不存在');
    }

    return order;
  }

  async assign(id: string, dto: AssignOrderDto) {
    const order = await this.findOne(id);
    
    if (order.status !== OrderStatus.CREATED) {
      throw new BadRequestException('只有待分派状态的单据才能分派');
    }

    const person = await this.prisma.repairPerson.findUnique({
      where: { id: dto.assignPersonId },
    });

    if (!person) {
      throw new NotFoundException('维修人员不存在');
    }

    const result = await this.prisma.$transaction(async (prisma) => {
      const updated = await prisma.repairOrder.update({
        where: { id },
        data: {
          assignPersonId: dto.assignPersonId,
          status: OrderStatus.ASSIGNED,
          planStartTime: dto.planStartTime ? new Date(dto.planStartTime) : undefined,
          planEndTime: dto.planEndTime ? new Date(dto.planEndTime) : undefined,
        },
        include: {
          assignPerson: true,
        },
      });

      await prisma.statusLog.create({
        data: {
          orderId: id,
          fromStatus: OrderStatus.CREATED,
          toStatus: OrderStatus.ASSIGNED,
          operatorId: 'system',
          remark: `分派给 ${person.name}`,
        },
      });

      return updated;
    });

    await this.redis.del('orders:active');

    return result;
  }

  async updateStatus(id: string, dto: UpdateStatusDto) {
    const order = await this.findOne(id);
    const fromStatus = order.status;
    const toStatus = dto.status;

    const validTransitions = this.getValidTransitions(fromStatus);
    if (!validTransitions.includes(toStatus)) {
      throw new BadRequestException(`无法从 ${fromStatus} 流转到 ${toStatus}`);
    }

    const result = await this.prisma.$transaction(async (prisma) => {
      const updateData: any = {
        status: toStatus,
      };

      if (toStatus === OrderStatus.IN_PROGRESS) {
        updateData.actualStartTime = new Date();
      }

      if (toStatus === OrderStatus.COMPLETED || toStatus === OrderStatus.CLOSED) {
        updateData.actualEndTime = new Date();
        if (order.planEndTime) {
          updateData.isOnTime = updateData.actualEndTime <= order.planEndTime;
        }
      }

      if (toStatus === OrderStatus.CLOSED) {
        updateData.closeTime = new Date();
        updateData.closeRemark = dto.remark;
      }

      const updated = await prisma.repairOrder.update({
        where: { id },
        data: updateData,
        include: {
          assignPerson: true,
        },
      });

      await prisma.statusLog.create({
        data: {
          orderId: id,
          fromStatus,
          toStatus,
          operatorId: dto.operatorId || 'system',
          remark: dto.remark,
        },
      });

      return updated;
    });

    await this.redis.del('orders:active');

    return result;
  }

  private getValidTransitions(current: OrderStatus): OrderStatus[] {
    const transitions: Record<OrderStatus, OrderStatus[]> = {
      [OrderStatus.CREATED]: [OrderStatus.ASSIGNED],
      [OrderStatus.ASSIGNED]: [OrderStatus.IN_PROGRESS, OrderStatus.CREATED],
      [OrderStatus.IN_PROGRESS]: [OrderStatus.COMPLETED, OrderStatus.PENDING_SUPPLEMENT, OrderStatus.UNDER_REVIEW],
      [OrderStatus.COMPLETED]: [OrderStatus.CLOSED, OrderStatus.UNDER_REVIEW, OrderStatus.PENDING_SUPPLEMENT],
      [OrderStatus.PENDING_SUPPLEMENT]: [OrderStatus.IN_PROGRESS, OrderStatus.COMPLETED],
      [OrderStatus.UNDER_REVIEW]: [OrderStatus.COMPLETED, OrderStatus.PENDING_SUPPLEMENT, OrderStatus.CLOSED],
      [OrderStatus.CLOSED]: [],
    };
    return transitions[current] || [];
  }

  async addDelayRecord(id: string, dto: AddDelayRecordDto) {
    const order = await this.findOne(id);

    const delayRecord = await this.prisma.delayRecord.create({
      data: {
        ...dto,
        orderId: id,
      },
    });

    return delayRecord;
  }

  async addMaterial(id: string, dto: AddMaterialDto) {
    const order = await this.findOne(id);

    const material = await this.prisma.material.findUnique({
      where: { id: dto.materialId },
    });

    if (!material) {
      throw new NotFoundException('材料不存在');
    }

    const existing = await this.prisma.orderMaterial.findUnique({
      where: {
        orderId_materialId: {
          orderId: id,
          materialId: dto.materialId,
        },
      },
    });

    if (existing) {
      return this.prisma.orderMaterial.update({
        where: { id: existing.id },
        data: {
          quantity: existing.quantity + dto.quantity,
        },
        include: { material: true },
      });
    }

    return this.prisma.orderMaterial.create({
      data: {
        orderId: id,
        materialId: dto.materialId,
        quantity: dto.quantity,
        usedAt: new Date(),
      },
      include: { material: true },
    });
  }

  async removeMaterial(orderId: string, materialId: string) {
    await this.prisma.orderMaterial.delete({
      where: {
        orderId_materialId: {
          orderId,
          materialId,
        },
      },
    });
    return { success: true };
  }

  async createSignoff(id: string, dto: CreateSignoffDto) {
    const order = await this.findOne(id);

    if (order.status === OrderStatus.CLOSED) {
      throw new BadRequestException('已关闭的单据无法创建签收凭证');
    }

    const signoff = await this.prisma.signoffProof.upsert({
      where: { orderId: id },
      create: {
        ...dto,
        orderId: id,
        signedAt: new Date(),
        photoUrls: dto.photoUrls || [],
      },
      update: {
        ...dto,
        signedAt: new Date(),
        photoUrls: dto.photoUrls || [],
      },
    });

    return signoff;
  }

  async updateReviewTags(id: string, dto: UpdateReviewTagsDto) {
    const order = await this.prisma.repairOrder.update({
      where: { id },
      data: {
        reviewTags: dto.tags,
      },
    });

    return order;
  }

  async closeOrder(id: string, dto: CloseOrderDto) {
    return this.updateStatus(id, {
      status: OrderStatus.CLOSED,
      remark: dto.closeRemark,
      operatorId: 'system',
    });
  }

  async getHistory(id: string) {
    const order = await this.findOne(id);
    
    const statusLogs = await this.prisma.statusLog.findMany({
      where: { orderId: id },
      orderBy: { createdAt: 'desc' },
    });

    return {
      order,
      statusLogs,
    };
  }

  async getActiveOrders(personId: string) {
    const cacheKey = `orders:active:${personId}`;
    const cached = await this.redis.get(cacheKey);
    
    if (cached) {
      return JSON.parse(cached);
    }

    const orders = await this.prisma.repairOrder.findMany({
      where: {
        assignPersonId: personId,
        status: {
          in: [OrderStatus.ASSIGNED, OrderStatus.IN_PROGRESS, OrderStatus.PENDING_SUPPLEMENT],
        },
      },
      orderBy: { priority: 'desc' },
      include: {
        routePlans: true,
      },
    });

    await this.redis.set(cacheKey, JSON.stringify(orders), 60);

    return orders;
  }
}
