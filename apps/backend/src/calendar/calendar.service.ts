import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { RoomStatus } from '@prisma/client';

@Injectable()
export class CalendarService {
  constructor(private prisma: PrismaService) {}

  async getCalendar(propertyId: number, params: {
    startDate?: string;
    endDate?: string;
    year?: number;
    month?: number;
    roomId?: number;
  }) {
    const { startDate, endDate, year, month, roomId } = params;

    const where: any = { propertyId };
    if (roomId) where.roomId = roomId;

    let start: Date;
    let end: Date;

    if (year && month) {
      start = new Date(year, month - 1, 1);
      end = new Date(year, month, 0);
    } else if (startDate && endDate) {
      start = new Date(startDate);
      end = new Date(endDate);
    } else {
      start = new Date();
      end = new Date(start.getTime() + 30 * 24 * 60 * 60 * 1000);
    }

    where.date = { gte: start, lte: end };

    const calendarData = await this.prisma.roomCalendar.findMany({
      where,
      orderBy: [{ roomId: 'asc' }, { date: 'asc' }],
      include: {
        room: {
          select: { roomNumber: true, roomType: true },
        },
      },
    });

    const rooms = await this.prisma.room.findMany({
      where: { propertyId, isActive: true },
      orderBy: { roomNumber: 'asc' },
      select: { id: true, roomNumber: true, roomType: true, pricePerNight: true },
    });

    const dates: Date[] = [];
    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
      dates.push(new Date(d));
    }

    const calendarMatrix = rooms.map(room => {
      const roomCalendar = dates.map(date => {
        const record = calendarData.find(
          c => c.roomId === room.id && this.isSameDay(c.date, date)
        );
        return {
          date: date.toISOString().split('T')[0],
          status: record?.status || RoomStatus.AVAILABLE,
          price: record?.price || room.pricePerNight,
          notes: record?.notes || null,
        };
      });
      return {
        room: { id: room.id, roomNumber: room.roomNumber, roomType: room.roomType },
        calendar: roomCalendar,
      };
    });

    if (year && month) {
      const monthStartDay = start.getDay();
      const daysInMonth = end.getDate();
      const matrix: any[][] = [];
      let currentWeek: any[] = [];
      for (let i = 0; i < monthStartDay; i++) {
        currentWeek.push(null);
      }
      for (let day = 1; day <= daysInMonth; day++) {
        const dateObj = new Date(year, month - 1, day);
        const dateStr = dateObj.toISOString().split('T')[0];
        let aggregatedStatus = RoomStatus.AVAILABLE;
        const dayRecords = calendarData.filter(c => this.isSameDay(c.date, dateObj));
        if (dayRecords.length > 0) {
          const statuses = dayRecords.map(r => r.status);
          if (statuses.includes(RoomStatus.OCCUPIED)) aggregatedStatus = RoomStatus.OCCUPIED;
          else if (statuses.includes(RoomStatus.MAINTENANCE)) aggregatedStatus = RoomStatus.MAINTENANCE;
          else if (statuses.includes(RoomStatus.CLEANING)) aggregatedStatus = RoomStatus.CLEANING;
        }
        currentWeek.push({ date: dateStr, status: aggregatedStatus });
        if (currentWeek.length === 7) {
          matrix.push(currentWeek);
          currentWeek = [];
        }
      }
      if (currentWeek.length > 0) {
        while (currentWeek.length < 7) currentWeek.push(null);
        matrix.push(currentWeek);
      }
      return {
        dates: dates.map(d => d.toISOString().split('T')[0]),
        rooms: calendarMatrix,
        matrix,
        year,
        month,
      };
    }

    return {
      dates: dates.map(d => d.toISOString().split('T')[0]),
      rooms: calendarMatrix,
    };
  }

  async updateCalendar(propertyId: number, roomId: number, date: string, data: any) {
    const calendarDate = new Date(date);

    const existing = await this.prisma.roomCalendar.findUnique({
      where: { roomId_date: { roomId, date: calendarDate } },
    });

    if (existing) {
      return this.prisma.roomCalendar.update({
        where: { roomId_date: { roomId, date: calendarDate } },
        data,
      });
    } else {
      return this.prisma.roomCalendar.create({
        data: {
          propertyId,
          roomId,
          date: calendarDate,
          status: data.status || RoomStatus.AVAILABLE,
          price: data.price || 0,
          notes: data.notes,
        },
      });
    }
  }

  async bulkUpdateCalendar(propertyId: number, data: {
    roomIds?: number[];
    startDate: string;
    endDate: string;
    status?: RoomStatus;
    price?: number;
    notes?: string;
  }) {
    const { roomIds, startDate, endDate, status, price, notes } = data;

    const rooms = roomIds && roomIds.length > 0
      ? await this.prisma.room.findMany({ where: { id: { in: roomIds }, propertyId } })
      : await this.prisma.room.findMany({ where: { propertyId, isActive: true } });

    const start = new Date(startDate);
    const end = new Date(endDate);

    const results = [];

    for (const room of rooms) {
      for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
        const date = new Date(d);
        const existing = await this.prisma.roomCalendar.findUnique({
          where: { roomId_date: { roomId: room.id, date } },
        });

        const updateData: any = {};
        if (status !== undefined) updateData.status = status;
        if (price !== undefined) updateData.price = price;
        if (notes !== undefined) updateData.notes = notes;

        if (existing) {
          results.push(
            await this.prisma.roomCalendar.update({
              where: { roomId_date: { roomId: room.id, date } },
              data: updateData,
            })
          );
        } else {
          results.push(
            await this.prisma.roomCalendar.create({
              data: {
                propertyId,
                roomId: room.id,
                date,
                status: status || RoomStatus.AVAILABLE,
                price: price !== undefined ? price : room.pricePerNight,
                notes,
              },
            })
          );
        }
      }
    }

    return { updated: results.length, results: results.slice(0, 10) };
  }

  async getRoomAvailability(propertyId: number, date: string) {
    const targetDate = new Date(date);

    const [totalRooms, occupiedRooms] = await Promise.all([
      this.prisma.room.count({ where: { propertyId, isActive: true } }),
      this.prisma.roomCalendar.count({
        where: {
          propertyId,
          date: targetDate,
          status: { in: [RoomStatus.OCCUPIED, RoomStatus.CLEANING, RoomStatus.MAINTENANCE, RoomStatus.BLOCKED] },
        },
      }),
    ]);

    const availableRooms = totalRooms - occupiedRooms;
    const occupancyRate = totalRooms > 0 ? (occupiedRooms / totalRooms * 100).toFixed(1) : '0';

    return {
      date,
      totalRooms,
      availableRooms,
      occupiedRooms,
      occupancyRate: parseFloat(occupancyRate),
    };
  }

  private isSameDay(date1: Date, date2: Date): boolean {
    return (
      date1.getFullYear() === date2.getFullYear() &&
      date1.getMonth() === date2.getMonth() &&
      date1.getDate() === date2.getDate()
    );
  }
}
