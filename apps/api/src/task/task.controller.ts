import { Controller, Get, Post, Put, Delete, Param, Body, Query, UseGuards, NotFoundException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { PrismaService } from '../prisma/prisma.service';
import { RedisService } from '../redis/redis.service';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { CreateTaskDto, UpdateTaskDto } from './dto/task.dto';
import { TaskStatus, VerificationStep } from '@prisma/client';

@Controller('tasks')
@UseGuards(AuthGuard('jwt'))
export class TaskController {
  constructor(
    private prisma: PrismaService,
    private redis: RedisService,
  ) {}

  @Get()
  async findAll(
    @Query('status') status?: TaskStatus,
    @Query('step') step?: VerificationStep,
    @Query('search') search?: string,
    @Query('riderId') riderId?: string,
    @Query('page') page = 1,
    @Query('limit') limit = 20,
  ) {
    const where: any = {};
    if (status) where.status = status;
    if (step) where.currentStep = step;
    if (riderId) where.riderId = riderId;
    if (search) {
      where.OR = [
        { taskNo: { contains: search } },
        { orderNo: { contains: search } },
        { itemName: { contains: search } },
        { pickupAddress: { contains: search } },
        { deliveryAddress: { contains: search } },
      ];
    }

    const [items, total] = await Promise.all([
      this.prisma.verificationTask.findMany({
        where,
        include: {
          rider: {
            include: {
              user: { select: { id: true, name: true, phone: true } },
            },
          },
          assignedTo: { select: { id: true, name: true } },
          createdBy: { select: { id: true, name: true } },
          damageReport: { select: { id: true, riskLevel: true, status: true } },
        },
        skip: (+page - 1) * +limit,
        take: +limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.verificationTask.count({ where }),
    ]);

    return { items, total, page: +page, limit: +limit };
  }

  @Get('dashboard/stats')
  async getDashboardStats() {
    const cacheKey = 'task:dashboard:stats';
    const cached = await this.redis.get(cacheKey);
    if (cached) return JSON.parse(cached);

    const result = {
      total: await this.prisma.verificationTask.count(),
      pending: await this.prisma.verificationTask.count({ where: { status: TaskStatus.PENDING } }),
      inProgress: await this.prisma.verificationTask.count({ where: { status: TaskStatus.IN_PROGRESS } }),
      verified: await this.prisma.verificationTask.count({ where: { status: TaskStatus.VERIFIED } }),
      completed: await this.prisma.verificationTask.count({ where: { status: TaskStatus.COMPLETED } }),
      damaged: await this.prisma.verificationTask.count({ where: { status: TaskStatus.DAMAGED } }),
    };

    await this.redis.set(cacheKey, JSON.stringify(result), 300);
    return result;
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    const task = await this.prisma.verificationTask.findUnique({
      where: { id },
      include: {
        rider: {
          include: {
            user: { select: { id: true, name: true, phone: true, avatarUrl: true } },
          },
        },
        assignedTo: { select: { id: true, name: true, role: true } },
        createdBy: { select: { id: true, name: true } },
        dispatchedBy: { select: { id: true, name: true } },
        tracks: {
          orderBy: { recordedAt: 'asc' },
          take: 500,
        },
        subsidy: true,
        damageReport: {
          include: {
            communications: {
              include: {
                sender: { select: { id: true, name: true, role: true } },
              },
              orderBy: { createdAt: 'asc' },
            },
            reviews: {
              include: {
                reviewer: { select: { id: true, name: true, role: true } },
              },
              orderBy: { reviewedAt: 'desc' },
            },
          },
        },
        stepLogs: {
          include: {
            operator: true,
          },
          orderBy: { createdAt: 'asc' },
        },
      },
    });

    if (!task) {
      throw new NotFoundException('任务不存在');
    }
    return task;
  }

  @Post()
  async create(@Body() dto: CreateTaskDto, @CurrentUser() user: any) {
    const taskNo = `VT${Date.now()}${Math.floor(Math.random() * 1000).toString().padStart(3, '0')}`;

    const task = await this.prisma.verificationTask.create({
      data: {
        ...dto,
        taskNo,
        createdById: user.id,
        status: TaskStatus.PENDING,
      },
      include: {
        rider: { include: { user: { select: { name: true, phone: true } } } },
      },
    });

    await this.redis.del('task:dashboard:stats');
    return task;
  }

  @Put(':id')
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateTaskDto,
    @CurrentUser() user: any,
  ) {
    const existing = await this.prisma.verificationTask.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundException('任务不存在');
    }

    const updateData: any = { ...dto };

    if (dto.status === TaskStatus.ASSIGNED && !existing.assignedAt) {
      updateData.assignedAt = new Date();
    }
    if (dto.status === TaskStatus.IN_PROGRESS && !existing.startedAt) {
      updateData.startedAt = new Date();
    }
    if (dto.status === TaskStatus.COMPLETED && !existing.completedAt) {
      updateData.completedAt = new Date();
    }

    if (dto.currentStep && dto.currentStep !== existing.currentStep) {
      await this.prisma.taskStepLog.create({
        data: {
          taskId: id,
          step: dto.currentStep,
          operatorId: user.id,
        },
      });
    }

    await this.redis.del('task:dashboard:stats');
    return this.prisma.verificationTask.update({
      where: { id },
      data: updateData,
    });
  }

  @Post(':id/tracks')
  async addTrack(
    @Param('id') id: string,
    @Body() body: { latitude: number; longitude: number; speed?: number; heading?: number },
  ) {
    const task = await this.prisma.verificationTask.findUnique({ where: { id } });
    if (!task) throw new NotFoundException('任务不存在');

    return this.prisma.riderTrack.create({
      data: {
        taskId: id,
        riderId: task.riderId,
        latitude: body.latitude,
        longitude: body.longitude,
        speed: body.speed,
        heading: body.heading,
        recordedAt: new Date(),
      },
    });
  }

  @Post(':id/subsidy')
  async applySubsidy(
    @Param('id') id: string,
    @Body() body: { type: string; amount: number; rule: any; remark?: string },
    @CurrentUser() user: any,
  ) {
    const task = await this.prisma.verificationTask.findUnique({ where: { id } });
    if (!task) throw new NotFoundException('任务不存在');

    return this.prisma.subsidyRecord.create({
      data: {
        taskId: id,
        riderId: task.riderId,
        subsidyType: body.type,
        amount: body.amount,
        ruleDetail: body.rule,
        remark: body.remark,
        approvedAt: new Date(),
        approvedBy: user.id,
      },
    });
  }
}
