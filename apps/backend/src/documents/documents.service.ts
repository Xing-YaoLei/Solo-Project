import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { DocumentStatus } from '@prisma/client';

@Injectable()
export class DocumentsService {
  constructor(private prisma: PrismaService) {}

  async findAll(params: {
    page?: number;
    pageSize?: number;
    orderId?: number;
    status?: DocumentStatus;
    keyword?: string;
    propertyId?: number;
  }) {
    const { page = 1, pageSize = 10, orderId, status, keyword, propertyId } = params;
    const skip = (page - 1) * pageSize;

    const where: any = {};
    if (orderId) where.orderId = orderId;
    if (status) where.status = status;
    if (keyword) {
      where.OR = [
        { guestName: { contains: keyword } },
        { documentNo: { contains: keyword } },
      ];
    }
    if (propertyId) {
      where.order = { propertyId };
    }

    const [documents, total] = await Promise.all([
      this.prisma.checkinDocument.findMany({
        where,
        skip,
        take: pageSize,
        orderBy: { createdAt: 'desc' },
        include: {
          order: {
            select: {
              orderNo: true,
              property: { select: { name: true } },
              room: { select: { roomNumber: true } },
            },
          },
        },
      }),
      this.prisma.checkinDocument.count({ where }),
    ]);

    return { list: documents, total, page, pageSize };
  }

  async findOne(id: number) {
    const document = await this.prisma.checkinDocument.findUnique({
      where: { id },
      include: {
        order: true,
        room: true,
      },
    });

    if (!document) {
      throw new NotFoundException('证件记录不存在');
    }

    return document;
  }

  async create(data: any) {
    return this.prisma.checkinDocument.create({
      data,
    });
  }

  async update(id: number, data: any) {
    const document = await this.prisma.checkinDocument.findUnique({ where: { id } });
    if (!document) {
      throw new NotFoundException('证件记录不存在');
    }

    return this.prisma.checkinDocument.update({
      where: { id },
      data,
    });
  }

  async verify(id: number, status: DocumentStatus, verifiedById: number, remarks?: string) {
    const document = await this.prisma.checkinDocument.findUnique({ where: { id } });
    if (!document) {
      throw new NotFoundException('证件记录不存在');
    }

    return this.prisma.checkinDocument.update({
      where: { id },
      data: {
        status,
        verifiedById,
        verifiedAt: new Date(),
        remarks,
      },
    });
  }

  async remove(id: number) {
    return this.prisma.checkinDocument.delete({ where: { id } });
  }

  async getPendingCount(propertyId?: number) {
    const where: any = { status: DocumentStatus.PENDING };
    if (propertyId) {
      where.order = { propertyId };
    }

    return this.prisma.checkinDocument.count({ where });
  }
}
