import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { PrismaService } from '../prisma/prisma.service';
import { RiderStatus } from '@prisma/client';

@Controller('riders')
@UseGuards(AuthGuard('jwt'))
export class RiderController {
  constructor(private prisma: PrismaService) {}

  @Get()
  async findAll(
    @Query('status') status?: RiderStatus,
    @Query('search') search?: string,
  ) {
    const where: any = {};
    if (status) where.status = status;
    if (search) {
      where.OR = [
        { riderCode: { contains: search } },
        { user: { name: { contains: search } } },
      ];
    }

    return this.prisma.riderProfile.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            phone: true,
            avatarUrl: true,
          },
        },
        activities: {
          take: 7,
          orderBy: { date: 'desc' },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.prisma.riderProfile.findUnique({
      where: { userId: id },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            phone: true,
            avatarUrl: true,
          },
        },
        tasks: {
          take: 10,
          orderBy: { createdAt: 'desc' },
        },
        activities: {
          take: 30,
          orderBy: { date: 'desc' },
        },
      },
    });
  }

  @Get(':id/tracks')
  async getTracks(
    @Param('id') id: string,
    @Query('taskId') taskId?: string,
    @Query('limit') limit = 100,
  ) {
    const where: any = { riderId: id };
    if (taskId) where.taskId = taskId;

    return this.prisma.riderTrack.findMany({
      where,
      take: +limit,
      orderBy: { recordedAt: 'desc' },
    });
  }
}
