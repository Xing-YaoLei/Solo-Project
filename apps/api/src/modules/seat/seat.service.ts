import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { RedisService } from '../../common/redis/redis.service';

@Injectable()
export class SeatService {
  constructor(private prisma: PrismaService, private redis: RedisService) {}

  async listMaps(activityId?: string) {
    return this.prisma.seatMap.findMany({
      where: activityId ? { activityId } : undefined,
      orderBy: { createdAt: 'desc' },
    });
  }

  async getMapDetail(seatMapId: string) {
    const cacheKey = `seatmap:${seatMapId}`;
    const cached = await this.redis.getJson(cacheKey);
    if (cached) return cached;

    const data = await this.prisma.seatMap.findUnique({
      where: { id: seatMapId },
      include: { seats: { orderBy: [{ sortY: 'asc' }, { sortX: 'asc' }] } },
    });
    if (data) await this.redis.setJson(cacheKey, data, 30);
    return data;
  }

  async createMap(data: any) {
    const result = await this.prisma.seatMap.create({ data });
    if (data.seats?.length) {
      await this.prisma.seat.createMany({ data: data.seats.map((s: any) => ({ ...s, seatMapId: result.id })) });
    }
    await this.redis.del(`seatmap:${result.id}`);
    return result;
  }

  async getSeatStats(seatMapId: string) {
    const seats = await this.prisma.seat.findMany({ where: { seatMapId } });
    const total = seats.length;
    const available = seats.filter((s) => s.status === 'AVAILABLE').length;
    const occupied = seats.filter((s) => s.status === 'OCCUPIED').length;
    const locked = seats.filter((s) => s.status === 'LOCKED').length;
    const reserved = seats.filter((s) => s.status === 'RESERVED').length;
    return { total, available, occupied, locked, reserved };
  }

  async lockSeat(seatId: string, lockedBy: string) {
    const seat = await this.prisma.seat.findUnique({ where: { id: seatId } });
    if (!seat) throw new NotFoundException('座位不存在');
    if (seat.status !== 'AVAILABLE') throw new BadRequestException(`座位当前状态「${seat.status}」不可锁定`);

    const updated = await this.prisma.seat.update({
      where: { id: seatId },
      data: { status: 'LOCKED', lockedBy, lockedAt: new Date() },
    });
    await this.redis.del(`seatmap:${seat.seatMapId}`);
    return updated;
  }

  async releaseSeat(seatId: string) {
    const seat = await this.prisma.seat.findUnique({ where: { id: seatId } });
    if (!seat) throw new NotFoundException('座位不存在');
    if (!['LOCKED', 'RESERVED'].includes(seat.status)) {
      throw new BadRequestException('当前座位状态不可释放');
    }

    const updated = await this.prisma.seat.update({
      where: { id: seatId },
      data: { status: 'AVAILABLE', lockedBy: null, lockedAt: null },
    });
    await this.redis.del(`seatmap:${seat.seatMapId}`);
    return updated;
  }

  async updateSeatStatus(seatId: string, status: string) {
    const seat = await this.prisma.seat.findUnique({ where: { id: seatId } });
    if (!seat) throw new NotFoundException('座位不存在');
    const updated = await this.prisma.seat.update({ where: { id: seatId }, data: { status: status as any } });
    await this.redis.del(`seatmap:${seat.seatMapId}`);
    return updated;
  }
}
