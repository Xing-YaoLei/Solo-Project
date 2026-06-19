import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class PropertiesService {
  constructor(private prisma: PrismaService) {}

  async findAll(status?: string) {
    return this.prisma.property.findMany({
      where: status ? { status } : undefined,
      orderBy: { createdAt: 'desc' },
      include: {
        _count: {
          select: { bookings: true, cleaningTasks: true },
        },
      },
    });
  }

  async findOne(id: string) {
    return this.prisma.property.findUnique({
      where: { id },
      include: {
        bookings: { take: 10, orderBy: { checkInDate: 'desc' } },
        cleaningTasks: { take: 10, orderBy: { taskDate: 'desc' } },
      },
    });
  }

  async getCalendar(propertyId: string, startDate: Date, endDate: Date) {
    const bookings = await this.prisma.booking.findMany({
      where: {
        propertyId,
        checkInDate: { lte: endDate },
        checkOutDate: { gte: startDate },
      },
      include: {
        deposit: true,
        documents: true,
      },
    });

    const cleaningTasks = await this.prisma.cleaningTask.findMany({
      where: {
        propertyId,
        taskDate: { gte: startDate, lte: endDate },
      },
      include: {
        assignedTo: { select: { id: true, name: true } },
      },
    });

    return { bookings, cleaningTasks };
  }

  async create(data: {
    name: string;
    address: string;
    roomNumber: string;
    type: string;
    area?: number;
    beds?: number;
    maxGuests?: number;
    status?: string;
  }) {
    return this.prisma.property.create({ data });
  }

  async update(id: string, data: {
    name?: string;
    address?: string;
    roomNumber?: string;
    type?: string;
    area?: number;
    beds?: number;
    maxGuests?: number;
    status?: string;
  }) {
    return this.prisma.property.update({ where: { id }, data });
  }
}
