import { Controller, Get, Post, Put, Param, Body, Query, UseGuards, NotFoundException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { PrismaService } from '../prisma/prisma.service';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { CreateDamageDto, UpdateDamageDto, AddCommunicationDto, AddReviewDto } from './dto/damage.dto';
import { DamageStatus, RiskLevel, TaskStatus } from '@prisma/client';

@Controller('damages')
@UseGuards(AuthGuard('jwt'))
export class DamageController {
  constructor(private prisma: PrismaService) {}

  @Get()
  async findAll(
    @Query('status') status?: DamageStatus,
    @Query('riskLevel') riskLevel?: RiskLevel,
    @Query('search') search?: string,
    @Query('page') page = 1,
    @Query('limit') limit = 20,
  ) {
    const where: any = {};
    if (status) where.status = status;
    if (riskLevel) where.riskLevel = riskLevel;
    if (search) {
      where.OR = [
        { reportNo: { contains: search } },
        { damageType: { contains: search } },
        { description: { contains: search } },
        { task: { taskNo: { contains: search } } },
      ];
    }

    const [items, total] = await Promise.all([
      this.prisma.damageReport.findMany({
        where,
        include: {
          task: {
            include: {
              rider: {
                include: { user: { select: { id: true, name: true, phone: true } } },
              },
            },
          },
          createdBy: { select: { id: true, name: true } },
          handledBy: { select: { id: true, name: true } },
        },
        skip: (+page - 1) * +limit,
        take: +limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.damageReport.count({ where }),
    ]);

    return { items, total, page: +page, limit: +limit };
  }

  @Get('stats')
  async getStats() {
    const [total, byStatus, byRisk] = await Promise.all([
      this.prisma.damageReport.count(),
      this.prisma.damageReport.groupBy({
        by: ['status'],
        _count: { status: true },
      }),
      this.prisma.damageReport.groupBy({
        by: ['riskLevel'],
        _count: { riskLevel: true },
      }),
    ]);

    const statusMap: Record<string, number> = {};
    byStatus.forEach((item: any) => {
      statusMap[item.status] = item._count.status;
    });

    const riskMap: Record<string, number> = {};
    byRisk.forEach((item: any) => {
      riskMap[item.riskLevel] = item._count.riskLevel;
    });

    return { total, byStatus: statusMap, byRisk: riskMap };
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    const damage = await this.prisma.damageReport.findUnique({
      where: { id },
      include: {
        task: {
          include: {
            rider: {
              include: { user: { select: { id: true, name: true, phone: true, avatarUrl: true } } },
            },
            assignedTo: { select: { id: true, name: true } },
          },
        },
        createdBy: { select: { id: true, name: true, role: true } },
        handledBy: { select: { id: true, name: true, role: true } },
        communications: {
          include: {
            sender: { select: { id: true, name: true, role: true, avatarUrl: true } },
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
    });

    if (!damage) {
      throw new NotFoundException('损坏报告不存在');
    }
    return damage;
  }

  @Post()
  async create(@Body() dto: CreateDamageDto, @CurrentUser() user: any) {
    const task = await this.prisma.verificationTask.findUnique({
      where: { id: dto.taskId },
    });
    if (!task) throw new NotFoundException('任务不存在');

    const reportNo = `DR${Date.now()}${Math.floor(Math.random() * 1000).toString().padStart(3, '0')}`;

    const [damage] = await Promise.all([
      this.prisma.damageReport.create({
        data: {
          ...dto,
          reportNo,
          riderId: task.riderId,
          createdById: user.id,
        },
      }),
      this.prisma.verificationTask.update({
        where: { id: dto.taskId },
        data: { status: TaskStatus.DAMAGED },
      }),
    ]);

    return damage;
  }

  @Put(':id')
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateDamageDto,
    @CurrentUser() user: any,
  ) {
    const existing = await this.prisma.damageReport.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('损坏报告不存在');

    const updateData: any = { ...dto };
    if (dto.status && !existing.handledById) {
      updateData.handledById = user.id;
    }

    return this.prisma.damageReport.update({
      where: { id },
      data: updateData,
    });
  }

  @Post(':id/communications')
  async addCommunication(
    @Param('id') id: string,
    @Body() dto: AddCommunicationDto,
    @CurrentUser() user: any,
  ) {
    const damage = await this.prisma.damageReport.findUnique({ where: { id } });
    if (!damage) throw new NotFoundException('损坏报告不存在');

    const communication = await this.prisma.damageCommunication.create({
      data: {
        ...dto,
        damageId: id,
        senderId: user.id,
      },
      include: {
        sender: { select: { id: true, name: true, role: true, avatarUrl: true } },
      },
    });

    if (damage.status === DamageStatus.REPORTED || damage.status === DamageStatus.UNDER_REVIEW) {
      await this.prisma.damageReport.update({
        where: { id },
        data: { status: DamageStatus.COMMUNICATING },
      });
    }

    return communication;
  }

  @Post(':id/reviews')
  async addReview(
    @Param('id') id: string,
    @Body() dto: AddReviewDto,
    @CurrentUser() user: any,
  ) {
    const damage = await this.prisma.damageReport.findUnique({ where: { id } });
    if (!damage) throw new NotFoundException('损坏报告不存在');

    const [review] = await Promise.all([
      this.prisma.damageReview.create({
        data: {
          ...dto,
          damageId: id,
          reviewerId: user.id,
        },
        include: {
          reviewer: { select: { id: true, name: true, role: true } },
        },
      }),
      this.prisma.damageReport.update({
        where: { id },
        data: {
          status: dto.approved ? DamageStatus.REVIEW_CONFIRMED : DamageStatus.UNDER_REVIEW,
        },
      }),
    ]);

    return review;
  }
}
