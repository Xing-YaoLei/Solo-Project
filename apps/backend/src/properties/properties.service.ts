import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UserRole } from '@prisma/client';

@Injectable()
export class PropertiesService {
  constructor(private prisma: PrismaService) {}

  async findAll(user: any, params: { page?: number; pageSize?: number; keyword?: string }) {
    const { page = 1, pageSize = 10, keyword } = params;
    const skip = (page - 1) * pageSize;

    const where: any = { isActive: true };
    if (keyword) {
      where.OR = [
        { name: { contains: keyword } },
        { city: { contains: keyword } },
        { address: { contains: keyword } },
      ];
    }

    const [properties, total] = await Promise.all([
      this.prisma.property.findMany({
        where,
        skip,
        take: pageSize,
        orderBy: { createdAt: 'desc' },
        include: {
          _count: {
            select: { rooms: true, orders: true },
          },
        },
      }),
      this.prisma.property.count({ where }),
    ]);

    return {
      list: properties,
      total,
      page,
      pageSize,
    };
  }

  async findOne(id: number) {
    const property = await this.prisma.property.findUnique({
      where: { id },
      include: {
        rooms: {
          where: { isActive: true },
          orderBy: { roomNumber: 'asc' },
        },
        _count: {
          select: { rooms: true, orders: true },
        },
      },
    });

    if (!property) {
      throw new NotFoundException('房源不存在');
    }

    return property;
  }

  async getRooms(propertyId: number, params: { page?: number; pageSize?: number }) {
    const { page = 1, pageSize = 20 } = params;
    const skip = (page - 1) * pageSize;

    const [rooms, total] = await Promise.all([
      this.prisma.room.findMany({
        where: { propertyId, isActive: true },
        skip,
        take: pageSize,
        orderBy: { roomNumber: 'asc' },
      }),
      this.prisma.room.count({ where: { propertyId, isActive: true } }),
    ]);

    return { list: rooms, total, page, pageSize };
  }

  async create(data: any) {
    return this.prisma.property.create({
      data,
    });
  }

  async update(id: number, data: any) {
    const property = await this.prisma.property.findUnique({ where: { id } });
    if (!property) {
      throw new NotFoundException('房源不存在');
    }

    return this.prisma.property.update({
      where: { id },
      data,
    });
  }

  async addRoom(propertyId: number, data: any) {
    const property = await this.prisma.property.findUnique({ where: { id: propertyId } });
    if (!property) {
      throw new NotFoundException('房源不存在');
    }

    return this.prisma.room.create({
      data: {
        ...data,
        propertyId,
      },
    });
  }

  async updateRoom(roomId: number, data: any) {
    return this.prisma.room.update({
      where: { id: roomId },
      data,
    });
  }

  async remove(id: number) {
    return this.prisma.property.update({
      where: { id },
      data: { isActive: false },
    });
  }
}
