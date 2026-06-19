import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class CheckinDocumentsService {
  constructor(private prisma: PrismaService) {}

  async findAll(params: {
    bookingId?: string;
    propertyId?: string;
    documentType?: string;
  }) {
    return this.prisma.checkinDocument.findMany({
      where: {
        bookingId: params.bookingId,
        propertyId: params.propertyId,
        documentType: params.documentType,
      },
      include: {
        booking: {
          include: {
            property: { select: { id: true, name: true, roomNumber: true } },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string) {
    return this.prisma.checkinDocument.findUnique({
      where: { id },
      include: {
        booking: {
          include: { property: true },
        },
        property: true,
      },
    });
  }

  async create(data: {
    bookingId: string;
    propertyId: string;
    documentType: string;
    documentNumber: string;
    documentImage?: string;
    guestName: string;
    issueDate?: Date;
    expiryDate?: Date;
  }) {
    return this.prisma.checkinDocument.create({ data });
  }

  async update(id: string, data: {
    documentType?: string;
    documentNumber?: string;
    documentImage?: string;
    guestName?: string;
    issueDate?: Date;
    expiryDate?: Date;
  }) {
    return this.prisma.checkinDocument.update({ where: { id }, data });
  }

  async delete(id: string) {
    return this.prisma.checkinDocument.delete({ where: { id } });
  }

  async getByDateRange(startDate: Date, endDate: Date, propertyId?: string) {
    return this.prisma.checkinDocument.findMany({
      where: {
        propertyId,
        createdAt: { gte: startDate, lte: endDate },
      },
      include: {
        booking: {
          select: { id: true, guestName: true, checkInDate: true, checkOutDate: true },
        },
        property: { select: { id: true, name: true, roomNumber: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }
}
