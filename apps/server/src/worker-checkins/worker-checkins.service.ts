import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateWorkerCheckinDto } from './dto/create-worker-checkin.dto';
import { UpdateWorkerCheckinDto } from './dto/update-worker-checkin.dto';
import { QueryWorkerCheckinDto } from './dto/query-worker-checkin.dto';
import { LogAction } from '@prisma/client';
import { CurrentUserType } from '../auth/current-user.decorator';

@Injectable()
export class WorkerCheckinsService {
  constructor(private prisma: PrismaService) {}

  async create(createDto: CreateWorkerCheckinDto, user: CurrentUserType) {
    const project = await this.prisma.project.findUnique({
      where: { id: createDto.projectId },
    });

    if (!project) {
      throw new NotFoundException('项目不存在');
    }

    const worker = await this.prisma.user.findUnique({
      where: { id: createDto.workerId },
    });

    if (!worker) {
      throw new NotFoundException('工人不存在');
    }

    const checkin = await this.prisma.workerCheckin.create({
      data: {
        ...createDto,
        checkinTime: createDto.checkinTime ? new Date(createDto.checkinTime) : new Date(),
      },
      include: {
        project: { select: { id: true, name: true } },
        worker: { select: { id: true, name: true, avatarUrl: true } },
      },
    });

    await this.createOperationLog(
      checkin.id,
      LogAction.CREATE,
      user.id,
      null,
      JSON.stringify(checkin),
      '工人签到',
    );

    return checkin;
  }

  async checkout(id: string, user: CurrentUserType) {
    const checkin = await this.prisma.workerCheckin.findUnique({
      where: { id },
    });

    if (!checkin) {
      throw new NotFoundException('签到记录不存在');
    }

    if (checkin.checkoutTime) {
      throw new BadRequestException('该签到记录已签退');
    }

    const oldValue = JSON.stringify(checkin);

    const updated = await this.prisma.workerCheckin.update({
      where: { id },
      data: {
        checkoutTime: new Date(),
      },
      include: {
        project: { select: { id: true, name: true } },
        worker: { select: { id: true, name: true, avatarUrl: true } },
      },
    });

    await this.createOperationLog(
      id,
      LogAction.STATUS_CHANGE,
      user.id,
      oldValue,
      JSON.stringify(updated),
      '工人签退',
    );

    return updated;
  }

  async findAll(query: QueryWorkerCheckinDto) {
    const { page = 1, pageSize = 10, projectId, workerId, workType, startDate, endDate } = query;
    const skip = (page - 1) * pageSize;

    const where: any = {};

    if (projectId) {
      where.projectId = projectId;
    }

    if (workerId) {
      where.workerId = workerId;
    }

    if (workType) {
      where.workType = workType;
    }

    if (startDate || endDate) {
      where.checkinTime = {};
      if (startDate) {
        where.checkinTime.gte = new Date(startDate);
      }
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        where.checkinTime.lte = end;
      }
    }

    const [list, total] = await Promise.all([
      this.prisma.workerCheckin.findMany({
        where,
        skip,
        take: pageSize,
        orderBy: { checkinTime: 'desc' },
        include: {
          project: { select: { id: true, name: true } },
          worker: { select: { id: true, name: true, avatarUrl: true } },
        },
      }),
      this.prisma.workerCheckin.count({ where }),
    ]);

    return {
      list,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    };
  }

  async findOne(id: string) {
    const checkin = await this.prisma.workerCheckin.findUnique({
      where: { id },
      include: {
        project: { select: { id: true, name: true, address: true } },
        worker: { select: { id: true, name: true, avatarUrl: true, phone: true } },
      },
    });

    if (!checkin) {
      throw new NotFoundException('签到记录不存在');
    }

    return checkin;
  }

  async update(id: string, updateDto: UpdateWorkerCheckinDto, user: CurrentUserType) {
    const existing = await this.prisma.workerCheckin.findUnique({ where: { id } });

    if (!existing) {
      throw new NotFoundException('签到记录不存在');
    }

    const oldValue = JSON.stringify(existing);

    const updated = await this.prisma.workerCheckin.update({
      where: { id },
      data: {
        ...updateDto,
        ...(updateDto.checkinTime && { checkinTime: new Date(updateDto.checkinTime) }),
      },
      include: {
        project: { select: { id: true, name: true } },
        worker: { select: { id: true, name: true, avatarUrl: true } },
      },
    });

    await this.createOperationLog(
      id,
      LogAction.UPDATE,
      user.id,
      oldValue,
      JSON.stringify(updated),
      '更新签到记录',
    );

    return updated;
  }

  async remove(id: string, user: CurrentUserType) {
    const existing = await this.prisma.workerCheckin.findUnique({ where: { id } });

    if (!existing) {
      throw new NotFoundException('签到记录不存在');
    }

    await this.prisma.workerCheckin.delete({ where: { id } });

    await this.createOperationLog(
      id,
      LogAction.DELETE,
      user.id,
      JSON.stringify(existing),
      null,
      '删除签到记录',
    );

    return { message: '删除成功' };
  }

  private async createOperationLog(
    entityId: string,
    action: LogAction,
    operatorId: string,
    oldValue: string | null,
    newValue: string | null,
    remark: string,
  ) {
    return this.prisma.operationLog.create({
      data: {
        action,
        entityType: 'WorkerCheckin',
        entityId,
        oldValue,
        newValue,
        remark,
        operatorId,
      },
    });
  }
}
