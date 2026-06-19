import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateMaintenanceReminderDto } from './dto/create-maintenance-reminder.dto';
import { UpdateMaintenanceReminderDto } from './dto/update-maintenance-reminder.dto';
import { paginate } from '../common/utils/pagination';

@Injectable()
export class MaintenanceRemindersService {
  constructor(private readonly prisma: PrismaService) {}

  async create(createMaintenanceReminderDto: CreateMaintenanceReminderDto) {
    return this.prisma.maintenanceReminder.create({
      data: createMaintenanceReminderDto,
      include: {
        vehicle: {
          select: {
            id: true,
            plateNumber: true,
            brand: true,
            model: true,
          },
        },
        responsible: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });
  }

  async findAll(
    page: number,
    pageSize: number,
    vehicleId?: string,
    isCompleted?: boolean,
  ) {
    const skip = (page - 1) * pageSize;
    const where: any = {};

    if (vehicleId) {
      where.vehicleId = vehicleId;
    }

    if (isCompleted !== undefined) {
      where.isCompleted = isCompleted;
    }

    const [total, reminders] = await Promise.all([
      this.prisma.maintenanceReminder.count({ where }),
      this.prisma.maintenanceReminder.findMany({
        skip,
        take: pageSize,
        where,
        include: {
          vehicle: {
            select: {
              id: true,
              plateNumber: true,
              brand: true,
              model: true,
            },
          },
          responsible: {
            select: {
              id: true,
              name: true,
            },
          },
        },
        orderBy: {
          nextDate: 'asc',
        },
      }),
    ]);

    return paginate(reminders, total, page, pageSize);
  }

  async findOne(id: string) {
    const reminder = await this.prisma.maintenanceReminder.findUnique({
      where: { id },
      include: {
        vehicle: true,
        responsible: {
          select: {
            id: true,
            name: true,
            phone: true,
          },
        },
      },
    });

    if (!reminder) {
      throw new NotFoundException('保养提醒不存在');
    }

    return reminder;
  }

  async update(
    id: string,
    updateMaintenanceReminderDto: UpdateMaintenanceReminderDto,
  ) {
    const reminder = await this.prisma.maintenanceReminder.findUnique({
      where: { id },
    });

    if (!reminder) {
      throw new NotFoundException('保养提醒不存在');
    }

    return this.prisma.maintenanceReminder.update({
      where: { id },
      data: updateMaintenanceReminderDto,
      include: {
        vehicle: true,
        responsible: true,
      },
    });
  }

  async complete(id: string) {
    const reminder = await this.prisma.maintenanceReminder.findUnique({
      where: { id },
    });

    if (!reminder) {
      throw new NotFoundException('保养提醒不存在');
    }

    return this.prisma.maintenanceReminder.update({
      where: { id },
      data: {
        isCompleted: true,
      },
      include: {
        vehicle: true,
        responsible: true,
      },
    });
  }

  async remove(id: string) {
    const reminder = await this.prisma.maintenanceReminder.findUnique({
      where: { id },
    });

    if (!reminder) {
      throw new NotFoundException('保养提醒不存在');
    }

    await this.prisma.maintenanceReminder.delete({
      where: { id },
    });

    return { message: '删除成功' };
  }
}
