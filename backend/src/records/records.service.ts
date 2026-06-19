import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class RecordsService {
  constructor(private prisma: PrismaService) {}

  async getRecordView(params: {
    propertyId?: string;
    startDate: Date;
    endDate: Date;
  }) {
    const { propertyId, startDate, endDate } = params;

    const [properties, bookings, cleaningTasks, documents] = await Promise.all([
      this.prisma.property.findMany({
        where: propertyId ? { id: propertyId } : undefined,
        orderBy: { roomNumber: 'asc' },
        include: {
          _count: {
            select: { bookings: true, cleaningTasks: true },
          },
        },
      }),
      this.prisma.booking.findMany({
        where: {
          propertyId,
          checkInDate: { lte: endDate },
          checkOutDate: { gte: startDate },
        },
        include: {
          property: { select: { id: true, name: true, roomNumber: true } },
          deposit: true,
          documents: true,
        },
        orderBy: { checkInDate: 'asc' },
      }),
      this.prisma.cleaningTask.findMany({
        where: {
          propertyId,
          taskDate: { gte: startDate, lte: endDate },
        },
        include: {
          property: { select: { id: true, name: true, roomNumber: true } },
          assignedTo: { select: { id: true, name: true, role: true } },
          booking: { select: { id: true, guestName: true } },
        },
        orderBy: { scheduledStart: 'asc' },
      }),
      this.prisma.checkinDocument.findMany({
        where: {
          propertyId,
          createdAt: { gte: startDate, lte: endDate },
        },
        include: {
          property: { select: { id: true, name: true, roomNumber: true } },
          booking: { select: { id: true, guestName: true, checkInDate: true } },
        },
        orderBy: { createdAt: 'desc' },
      }),
    ]);

    const calendarData = properties.map(property => {
      const propertyBookings = bookings.filter(b => b.propertyId === property.id);
      const propertyTasks = cleaningTasks.filter(t => t.propertyId === property.id);
      const propertyDocs = documents.filter(d => d.propertyId === property.id);

      return {
        property,
        bookings: propertyBookings,
        cleaningTasks: propertyTasks,
        documents: propertyDocs,
      };
    });

    return {
      dateRange: { startDate, endDate },
      totalProperties: properties.length,
      totalBookings: bookings.length,
      totalCleaningTasks: cleaningTasks.length,
      totalDocuments: documents.length,
      calendarData,
      bookings,
      cleaningTasks,
      documents,
    };
  }

  async getPropertyTimeline(propertyId: string, date: Date) {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    const [bookings, tasks, documents] = await Promise.all([
      this.prisma.booking.findMany({
        where: {
          propertyId,
          checkInDate: { lte: endOfDay },
          checkOutDate: { gte: startOfDay },
        },
        include: { deposit: true, documents: true },
      }),
      this.prisma.cleaningTask.findMany({
        where: {
          propertyId,
          taskDate: { gte: startOfDay, lte: endOfDay },
        },
        include: {
          assignedTo: { select: { id: true, name: true } },
        },
      }),
      this.prisma.checkinDocument.findMany({
        where: {
          propertyId,
          createdAt: { gte: startOfDay, lte: endOfDay },
        },
      }),
    ]);

    return {
      date: date.toISOString().split('T')[0],
      propertyId,
      bookings,
      cleaningTasks: tasks,
      documents,
    };
  }
}
