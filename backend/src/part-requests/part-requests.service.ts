import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { RedisService } from '../redis/redis.service';
import { CreatePartRequestDto } from './dto/create-part-request.dto';
import { UpdatePartRequestDto } from './dto/update-part-request.dto';
import { paginate } from '../common/utils/pagination';
import { PartRequestStatus, PartRequestSource } from '@prisma/client';

@Injectable()
export class PartRequestsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly redisService: RedisService,
  ) {}

  private generateRequestNumber(): string {
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const random = Math.floor(Math.random() * 10000)
      .toString()
      .padStart(4, '0');
    return `PR${year}${month}${day}${random}`;
  }

  async create(createPartRequestDto: CreatePartRequestDto) {
    const requestNumber = this.generateRequestNumber();

    const result = await this.prisma.partRequest.create({
      data: {
        ...createPartRequestDto,
        requestNumber,
      },
      include: {
        workOrder: {
          select: {
            id: true,
            orderNumber: true,
          },
        },
        part: true,
      },
    });

    await this.redisService.del('partrequest:kanban');

    return result;
  }

  async findAll(
    page: number,
    pageSize: number,
    status?: string,
    workOrderId?: string,
  ) {
    const skip = (page - 1) * pageSize;
    const where: any = {};

    if (status) {
      where.status = status as PartRequestStatus;
    }

    if (workOrderId) {
      where.workOrderId = workOrderId;
    }

    const [total, partRequests] = await Promise.all([
      this.prisma.partRequest.count({ where }),
      this.prisma.partRequest.findMany({
        skip,
        take: pageSize,
        where,
        include: {
          workOrder: {
            select: {
              id: true,
              orderNumber: true,
            },
          },
          part: true,
        },
        orderBy: {
          createdAt: 'desc',
        },
      }),
    ]);

    return paginate(partRequests, total, page, pageSize);
  }

  async findOne(id: string) {
    const partRequest = await this.prisma.partRequest.findUnique({
      where: { id },
      include: {
        workOrder: {
          include: {
            vehicle: true,
          },
        },
        part: true,
      },
    });

    if (!partRequest) {
      throw new NotFoundException('配件申请不存在');
    }

    return partRequest;
  }

  async update(id: string, updatePartRequestDto: UpdatePartRequestDto) {
    const partRequest = await this.prisma.partRequest.findUnique({
      where: { id },
    });

    if (!partRequest) {
      throw new NotFoundException('配件申请不存在');
    }

    const updated = await this.prisma.partRequest.update({
      where: { id },
      data: updatePartRequestDto,
      include: {
        workOrder: true,
        part: true,
      },
    });

    if (updatePartRequestDto.status && updatePartRequestDto.status !== partRequest.status) {
      await this.redisService.del('partrequest:kanban');
    }

    return updated;
  }

  async updateStatus(
    id: string,
    status: string,
    handlerId: string,
    handlingNotes?: string,
    source?: PartRequestSource,
    beforeMaterial?: string,
    afterMaterial?: string,
    conclusion?: string,
  ) {
    const partRequest = await this.prisma.partRequest.findUnique({
      where: { id },
    });

    if (!partRequest) {
      throw new NotFoundException('配件申请不存在');
    }

    const newStatus = status as PartRequestStatus;
    const data: any = {
      status: newStatus,
      handlerId,
      handlingNotes,
    };

    if (source) {
      data.source = source;
    }
    if (beforeMaterial) {
      data.beforeMaterial = beforeMaterial;
    }
    if (afterMaterial) {
      data.afterMaterial = afterMaterial;
    }

    if (
      newStatus === PartRequestStatus.APPROVED ||
      newStatus === PartRequestStatus.COMPLETED
    ) {
      data.handledAt = new Date();
    }

    const updatedPartRequest = await this.prisma.partRequest.update({
      where: { id },
      data,
      include: {
        workOrder: true,
        part: true,
      },
    });

    await this.createHistory(
      id,
      partRequest.status,
      newStatus,
      handlerId,
      handlingNotes,
      source,
      beforeMaterial,
      afterMaterial,
      conclusion,
    );

    await this.redisService.del('partrequest:kanban');
    await this.updatePartStockWarningCache();

    return updatedPartRequest;
  }

  async remove(id: string) {
    const partRequest = await this.prisma.partRequest.findUnique({
      where: { id },
    });

    if (!partRequest) {
      throw new NotFoundException('配件申请不存在');
    }

    await this.prisma.partRequest.delete({
      where: { id },
    });

    await this.redisService.del('partrequest:kanban');

    return { message: '删除成功' };
  }

  async getHistories(partRequestId: string) {
    return this.prisma.partRequestHistory.findMany({
      where: { partRequestId },
      include: {
        handler: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: { changedAt: 'desc' },
    });
  }

  async getKanbanStats() {
    const cacheKey = 'partrequest:kanban';
    const cached = await this.redisService.getJson<any>(cacheKey);

    if (cached) {
      return cached;
    }

    const statusCounts = await this.prisma.partRequest.groupBy({
      by: ['status'],
      _count: true,
    });

    const stats: Record<string, number> = {};
    statusCounts.forEach((item) => {
      stats[item.status] = item._count;
    });

    const now = new Date();
    const timeoutThreshold = new Date(now.getTime() - 24 * 60 * 60 * 1000);

    const timeoutCount = await this.prisma.partRequest.count({
      where: {
        status: {
          in: [PartRequestStatus.PENDING, PartRequestStatus.PROCURING],
        },
        createdAt: {
          lt: timeoutThreshold,
        },
      },
    });

    const result = {
      statusDistribution: stats,
      timeoutCount,
      total: Object.values(stats).reduce((sum, count) => sum + count, 0),
    };

    await this.redisService.setJson(cacheKey, result, 300);

    return result;
  }

  async getTimeoutRequests(page: number, pageSize: number) {
    const skip = (page - 1) * pageSize;
    const now = new Date();
    const timeoutThreshold = new Date(now.getTime() - 24 * 60 * 60 * 1000);

    const where = {
      status: {
        in: [PartRequestStatus.PENDING, PartRequestStatus.PROCURING],
      },
      createdAt: {
        lt: timeoutThreshold,
      },
    };

    const [total, requests] = await Promise.all([
      this.prisma.partRequest.count({ where }),
      this.prisma.partRequest.findMany({
        skip,
        take: pageSize,
        where,
        include: {
          workOrder: {
            select: {
              id: true,
              orderNumber: true,
            },
          },
          part: true,
        },
        orderBy: { createdAt: 'asc' },
      }),
    ]);

    return paginate(requests, total, page, pageSize);
  }

  private async createHistory(
    partRequestId: string,
    oldStatus: PartRequestStatus,
    newStatus: PartRequestStatus,
    handlerId: string,
    handlingNotes?: string,
    source?: PartRequestSource,
    beforeMaterial?: string,
    afterMaterial?: string,
    conclusion?: string,
  ) {
    return this.prisma.partRequestHistory.create({
      data: {
        partRequestId,
        oldStatus,
        newStatus,
        handlerId,
        handlingNotes,
        source,
        beforeMaterial,
        afterMaterial,
        conclusion,
      },
    });
  }

  private async updatePartStockWarningCache() {
    try {
      const lowStockParts = await this.prisma.$queryRaw<any[]>`
        SELECT id, name, "partNumber", stock, "minStock"
        FROM parts
        WHERE stock <= "minStock"
        ORDER BY stock ASC
      `;

      await this.redisService.setJson('part:low_stock', lowStockParts, 600);
    } catch (error) {
      console.error('Failed to update part stock warning cache:', error);
    }
  }

  async getLowStockParts() {
    let lowStockParts = await this.redisService.getJson<any[]>('part:low_stock');

    if (!lowStockParts) {
      lowStockParts = await this.prisma.$queryRaw<any[]>`
        SELECT id, name, "partNumber", stock, "minStock", category
        FROM parts
        WHERE stock <= "minStock"
        ORDER BY stock ASC
      `;

      await this.redisService.setJson('part:low_stock', lowStockParts, 600);
    }

    return lowStockParts;
  }
}
