import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { RedisService } from '../redis/redis.service';
import { CreateWorkOrderDto } from './dto/create-work-order.dto';
import { UpdateWorkOrderDto } from './dto/update-work-order.dto';
import { BatchUpdateStatusDto } from './dto/batch-update-status.dto';
import { BatchAssignDto } from './dto/batch-assign.dto';
import { AssignTechnicianDto } from './dto/assign-technician.dto';
import { paginate } from '../common/utils/pagination';
import { WorkOrderStatus, WorkOrderLogType, RoleEnum } from '@prisma/client';

@Injectable()
export class WorkOrdersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly redisService: RedisService,
  ) {}

  private generateOrderNumber(): string {
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const random = Math.floor(Math.random() * 10000)
      .toString()
      .padStart(4, '0');
    return `WO${year}${month}${day}${random}`;
  }

  async create(createWorkOrderDto: CreateWorkOrderDto) {
    const orderNumber = this.generateOrderNumber();

    const workOrder = await this.prisma.workOrder.create({
      data: {
        ...createWorkOrderDto,
        orderNumber,
        items: createWorkOrderDto.items
          ? {
              create: createWorkOrderDto.items.map((item, index) => ({
                ...item,
                sortOrder: index,
              })),
            }
          : undefined,
      },
      include: {
        vehicle: true,
        advisor: {
          select: {
            id: true,
            name: true,
            username: true,
          },
        },
        technician: {
          select: {
            id: true,
            name: true,
            username: true,
          },
        },
        items: true,
      },
    });

    await this.createLog(
      workOrder.id,
      createWorkOrderDto.advisorId,
      WorkOrderLogType.CREATED,
      '创建工单',
    );

    return workOrder;
  }

  async findAll(
    page: number,
    pageSize: number,
    status?: string,
    vehicleId?: string,
  ) {
    const skip = (page - 1) * pageSize;
    const where: any = {};

    if (status) {
      where.status = status as WorkOrderStatus;
    }

    if (vehicleId) {
      where.vehicleId = vehicleId;
    }

    const [total, workOrders] = await Promise.all([
      this.prisma.workOrder.count({ where }),
      this.prisma.workOrder.findMany({
        skip,
        take: pageSize,
        where,
        include: {
          vehicle: true,
          advisor: {
            select: {
              id: true,
              name: true,
            },
          },
          technician: {
            select: {
              id: true,
              name: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
      }),
    ]);

    return paginate(workOrders, total, page, pageSize);
  }

  async findOne(id: string) {
    const workOrder = await this.prisma.workOrder.findUnique({
      where: { id },
      include: {
        vehicle: true,
        advisor: {
          select: {
            id: true,
            name: true,
            username: true,
            phone: true,
          },
        },
        technician: {
          select: {
            id: true,
            name: true,
            username: true,
            phone: true,
          },
        },
        items: {
          include: {
            parts: {
              include: {
                part: true,
              },
            },
          },
          orderBy: { sortOrder: 'asc' },
        },
        partRequests: true,
        qualityChecks: true,
        logs: {
          include: {
            operator: {
              select: {
                id: true,
                name: true,
              },
            },
          },
          orderBy: { timestamp: 'desc' },
        },
      },
    });

    if (!workOrder) {
      throw new NotFoundException('工单不存在');
    }

    return workOrder;
  }

  async update(id: string, updateWorkOrderDto: UpdateWorkOrderDto) {
    const workOrder = await this.prisma.workOrder.findUnique({
      where: { id },
    });

    if (!workOrder) {
      throw new NotFoundException('工单不存在');
    }

    const { items, ...data } = updateWorkOrderDto;

    const updatedWorkOrder = await this.prisma.workOrder.update({
      where: { id },
      data,
      include: {
        vehicle: true,
        advisor: true,
        technician: true,
        items: true,
      },
    });

    await this.createLog(
      id,
      updateWorkOrderDto.advisorId || workOrder.advisorId,
      WorkOrderLogType.UPDATED,
      '更新工单信息',
    );

    return updatedWorkOrder;
  }

  async updateStatus(id: string, status: string) {
    const workOrder = await this.prisma.workOrder.findUnique({
      where: { id },
    });

    if (!workOrder) {
      throw new NotFoundException('工单不存在');
    }

    const newStatus = status as WorkOrderStatus;
    const data: any = { status: newStatus };

    if (newStatus === WorkOrderStatus.IN_PROGRESS && !workOrder.startTime) {
      data.startTime = new Date();
    }

    if (
      newStatus === WorkOrderStatus.COMPLETED &&
      !workOrder.endTime
    ) {
      data.endTime = new Date();
    }

    const updatedWorkOrder = await this.prisma.workOrder.update({
      where: { id },
      data,
    });

    await this.createLog(
      id,
      workOrder.advisorId,
      WorkOrderLogType.STATUS_CHANGED,
      `状态变更为: ${status}`,
      workOrder.status,
      status,
    );

    await this.updateCacheStats();

    return updatedWorkOrder;
  }

  async remove(id: string) {
    const workOrder = await this.prisma.workOrder.findUnique({
      where: { id },
    });

    if (!workOrder) {
      throw new NotFoundException('工单不存在');
    }

    await this.prisma.workOrder.delete({
      where: { id },
    });

    return { message: '删除成功' };
  }

  async getLogs(id: string) {
    return this.prisma.workOrderLog.findMany({
      where: { workOrderId: id },
      include: {
        operator: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: { timestamp: 'desc' },
    });
  }

  async batchUpdateStatus(batchUpdateStatusDto: BatchUpdateStatusDto) {
    const { ids, status, operatorId } = batchUpdateStatusDto;
    const newStatus = status as WorkOrderStatus;

    const workOrders = await this.prisma.workOrder.findMany({
      where: { id: { in: ids } },
    });

    if (workOrders.length !== ids.length) {
      throw new NotFoundException('部分工单不存在');
    }

    const data: any = { status: newStatus };

    if (newStatus === WorkOrderStatus.IN_PROGRESS) {
      data.startTime = new Date();
    }

    if (newStatus === WorkOrderStatus.COMPLETED) {
      data.endTime = new Date();
    }

    const updatedWorkOrders = await this.prisma.$transaction(
      ids.map((id) =>
        this.prisma.workOrder.update({
          where: { id },
          data,
        }),
      ),
    );

    await this.prisma.$transaction(
      workOrders.map((workOrder) =>
        this.prisma.workOrderLog.create({
          data: {
            workOrderId: workOrder.id,
            operatorId,
            type: WorkOrderLogType.STATUS_CHANGED,
            content: `批量更新状态为: ${status}`,
            oldValue: workOrder.status,
            newValue: status,
          },
        }),
      ),
    );

    await this.updateCacheStats();

    return {
      success: true,
      count: updatedWorkOrders.length,
      workOrders: updatedWorkOrders,
    };
  }

  async batchAssign(batchAssignDto: BatchAssignDto) {
    const { ids, technicianId, operatorId } = batchAssignDto;

    const workOrders = await this.prisma.workOrder.findMany({
      where: { id: { in: ids } },
    });

    if (workOrders.length !== ids.length) {
      throw new NotFoundException('部分工单不存在');
    }

    const technician = await this.prisma.user.findUnique({
      where: { id: technicianId },
      include: { role: true },
    });

    if (!technician) {
      throw new NotFoundException('技师不存在');
    }

    const updatedWorkOrders = await this.prisma.$transaction(
      ids.map((id) =>
        this.prisma.workOrder.update({
          where: { id },
          data: { technicianId },
        }),
      ),
    );

    await this.prisma.$transaction(
      workOrders.map((workOrder) =>
        this.prisma.workOrderLog.create({
          data: {
            workOrderId: workOrder.id,
            operatorId,
            type: WorkOrderLogType.ASSIGNED,
            content: `批量分派技师: ${technician.name}`,
            oldValue: workOrder.technicianId,
            newValue: technicianId,
          },
        }),
      ),
    );

    return {
      success: true,
      count: updatedWorkOrders.length,
      workOrders: updatedWorkOrders,
    };
  }

  async assignTechnician(id: string, assignTechnicianDto: AssignTechnicianDto) {
    const { technicianId, operatorId } = assignTechnicianDto;

    const workOrder = await this.prisma.workOrder.findUnique({
      where: { id },
    });

    if (!workOrder) {
      throw new NotFoundException('工单不存在');
    }

    const technician = await this.prisma.user.findUnique({
      where: { id: technicianId },
      include: { role: true },
    });

    if (!technician) {
      throw new NotFoundException('技师不存在');
    }

    const updatedWorkOrder = await this.prisma.workOrder.update({
      where: { id },
      data: { technicianId },
      include: {
        technician: {
          select: {
            id: true,
            name: true,
            username: true,
          },
        },
      },
    });

    await this.createLog(
      id,
      operatorId,
      WorkOrderLogType.ASSIGNED,
      `分派技师: ${technician.name}`,
      workOrder.technicianId,
      technicianId,
    );

    return updatedWorkOrder;
  }

  async getTechnicians() {
    return this.prisma.user.findMany({
      where: {
        role: {
          code: RoleEnum.TECHNICIAN,
        },
        isActive: true,
      },
      select: {
        id: true,
        name: true,
        username: true,
        phone: true,
        avatar: true,
      },
      orderBy: { createdAt: 'asc' },
    });
  }

  async updateCacheStats() {
    try {
      const statusCounts = await this.prisma.workOrder.groupBy({
        by: ['status'],
        _count: true,
      });

      const stats: Record<string, number> = {};
      statusCounts.forEach((item) => {
        stats[item.status] = item._count;
      });

      const total = Object.values(stats).reduce((sum, count) => sum + count, 0);
      stats['TOTAL'] = total;

      await this.redisService.setJson('workorder:stats', stats, 300);
    } catch (error) {
      console.error('Failed to update work order stats cache:', error);
    }
  }

  async getCacheStats() {
    let stats = await this.redisService.getJson<Record<string, number>>('workorder:stats');

    if (!stats) {
      await this.updateCacheStats();
      stats = await this.redisService.getJson<Record<string, number>>('workorder:stats');
    }

    return stats;
  }

  private async createLog(
    workOrderId: string,
    operatorId: string,
    type: WorkOrderLogType,
    content: string,
    oldValue?: string,
    newValue?: string,
  ) {
    return this.prisma.workOrderLog.create({
      data: {
        workOrderId,
        operatorId,
        type,
        content,
        oldValue,
        newValue,
      },
    });
  }
}
