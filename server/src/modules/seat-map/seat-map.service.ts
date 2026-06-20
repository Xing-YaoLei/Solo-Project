import { Injectable, NotFoundException } from '@nestjs/common';
import { prisma } from '../../prisma';
import { CreateSeatMapDto, UpdateSeatMapDto, UpdateThresholdDto, FilterSeatAvailabilityDto } from './seat-map.dto';
import { Prisma } from '../../../generated/prisma/client.js';

@Injectable()
export class SeatMapService {
  async create(dto: CreateSeatMapDto) {
    return prisma.$transaction(async (tx) => {
      const seatMap = await tx.seatMap.create({
        data: {
          eventId: dto.eventId,
          name: dto.name,
          totalSeats: dto.totalSeats,
          thresholdWarn: dto.thresholdWarn ?? 80,
          thresholdFull: dto.thresholdFull ?? 95,
          layoutData: (dto.layoutData ?? Prisma.JsonNull) as Prisma.InputJsonValue,
        },
      });

      for (const zone of dto.zones) {
        const seatZone = await tx.seatZone.create({
          data: {
            seatMapId: seatMap.id,
            name: zone.name,
            area: zone.area,
            rowCount: zone.rowCount,
            colCount: zone.colCount,
            price: zone.price,
          },
        });

        const seatData: { zoneId: string; rowLabel: string; colLabel: string; seatNo: string; status: string }[] = [];
        for (let r = 0; r < zone.rowCount; r++) {
          const rowLabel = String.fromCharCode(65 + r);
          for (let c = 1; c <= zone.colCount; c++) {
            const colLabel = String(c);
            const seatNo = `${rowLabel}${colLabel}`;
            seatData.push({
              zoneId: seatZone.id,
              rowLabel,
              colLabel,
              seatNo,
              status: 'available',
            });
          }
        }

        if (seatData.length > 0) {
          await tx.seat.createMany({ data: seatData });
        }
      }

      return tx.seatMap.findUnique({
        where: { id: seatMap.id },
        include: { zones: { include: { seats: true } } },
      });
    });
  }

  async findAll(eventId?: string) {
    const where: Record<string, unknown> = {};
    if (eventId) where.eventId = eventId;

    return prisma.seatMap.findMany({
      where,
      include: { event: { select: { id: true, name: true } }, zones: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string) {
    const seatMap = await prisma.seatMap.findUnique({
      where: { id },
      include: { event: true, zones: { include: { seats: true } } },
    });
    if (!seatMap) throw new NotFoundException(`SeatMap ${id} not found`);
    return seatMap;
  }

  async update(id: string, dto: UpdateSeatMapDto) {
    await this.findOne(id);
    const data: Record<string, unknown> = {};
    if (dto.name !== undefined) data.name = dto.name;
    if (dto.totalSeats !== undefined) data.totalSeats = dto.totalSeats;
    if (dto.layoutData !== undefined) data.layoutData = dto.layoutData as Prisma.InputJsonValue;

    return prisma.seatMap.update({ where: { id }, data });
  }

  async updateThreshold(id: string, dto: UpdateThresholdDto) {
    await this.findOne(id);
    return prisma.seatMap.update({
      where: { id },
      data: {
        thresholdWarn: dto.thresholdWarn,
        thresholdFull: dto.thresholdFull,
      },
    });
  }

  async remove(id: string) {
    await this.findOne(id);
    return prisma.seatMap.delete({ where: { id } });
  }

  async getSeatAvailability(id: string, filter: FilterSeatAvailabilityDto) {
    const seatMap = await prisma.seatMap.findUnique({ where: { id } });
    if (!seatMap) throw new NotFoundException(`SeatMap ${id} not found`);

    const zoneWhere: Record<string, unknown> = { seatMapId: id };
    if (filter.area) zoneWhere.area = filter.area;
    if (filter.zoneId) zoneWhere.id = filter.zoneId;

    const zones = await prisma.seatZone.findMany({
      where: zoneWhere,
      include: {
        seats: filter.status ? { where: { status: filter.status } } : true,
      },
    });

    const totalSeats = seatMap.totalSeats;
    const soldCount = await prisma.seat.count({
      where: {
        zone: { seatMapId: id },
        status: 'sold',
        ...(filter.zoneId && { zoneId: filter.zoneId }),
        ...(filter.area && { zone: { area: filter.area } }),
      },
    });

    const availableCount = await prisma.seat.count({
      where: {
        zone: { seatMapId: id },
        status: 'available',
        ...(filter.zoneId && { zoneId: filter.zoneId }),
        ...(filter.area && { zone: { area: filter.area } }),
      },
    });

    const soldPercent = totalSeats > 0 ? Math.round((soldCount / totalSeats) * 100) : 0;

    return {
      seatMapId: id,
      totalSeats,
      soldCount,
      availableCount,
      soldPercent,
      thresholdWarn: seatMap.thresholdWarn,
      thresholdFull: seatMap.thresholdFull,
      isWarning: soldPercent >= seatMap.thresholdWarn,
      isFull: soldPercent >= seatMap.thresholdFull,
      zones,
    };
  }
}
