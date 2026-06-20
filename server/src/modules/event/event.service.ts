import { Injectable, NotFoundException } from '@nestjs/common';
import { prisma } from '../../prisma';
import { CreateEventDto, UpdateEventDto, FilterEventDto } from './event.dto';

@Injectable()
export class EventService {
  async create(dto: CreateEventDto) {
    return prisma.event.create({
      data: {
        name: dto.name,
        description: dto.description,
        venue: dto.venue,
        eventDate: new Date(dto.eventDate),
        status: dto.status ?? 'draft',
        managerId: dto.managerId,
      },
    });
  }

  async findAll(filter: FilterEventDto) {
    const where: Record<string, unknown> = {};

    if (filter.status) {
      where.status = filter.status;
    }

    if (filter.managerId) {
      where.managerId = filter.managerId;
    }

    if (filter.dateFrom || filter.dateTo) {
      where.eventDate = {
        ...(filter.dateFrom && { gte: new Date(filter.dateFrom) }),
        ...(filter.dateTo && { lte: new Date(filter.dateTo) }),
      };
    }

    const page = filter.page ?? 1;
    const limit = filter.limit ?? 20;
    const skip = (page - 1) * limit;

    const [items, total] = await Promise.all([
      prisma.event.findMany({
        where,
        skip,
        take: limit,
        orderBy: { eventDate: 'desc' },
        include: { manager: { select: { id: true, name: true, email: true } } },
      }),
      prisma.event.count({ where }),
    ]);

    return { items, total, page, limit };
  }

  async findOne(id: string) {
    const event = await prisma.event.findUnique({
      where: { id },
      include: { manager: { select: { id: true, name: true, email: true } } },
    });
    if (!event) throw new NotFoundException(`Event ${id} not found`);
    return event;
  }

  async update(id: string, dto: UpdateEventDto) {
    await this.findOne(id);
    const data: Record<string, unknown> = {};
    if (dto.name !== undefined) data.name = dto.name;
    if (dto.description !== undefined) data.description = dto.description;
    if (dto.venue !== undefined) data.venue = dto.venue;
    if (dto.eventDate !== undefined) data.eventDate = new Date(dto.eventDate);
    if (dto.status !== undefined) data.status = dto.status;
    if (dto.managerId !== undefined) data.managerId = dto.managerId;

    return prisma.event.update({ where: { id }, data });
  }

  async remove(id: string) {
    await this.findOne(id);
    return prisma.event.delete({ where: { id } });
  }
}
