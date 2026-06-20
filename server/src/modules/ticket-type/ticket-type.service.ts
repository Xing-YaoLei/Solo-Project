import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { prisma } from '../../prisma';
import { Prisma } from '../../../generated/prisma/client.js';
import { CreateTicketTypeDto, UpdateTicketTypeDto, FilterTicketTypeDto } from './ticket-type.dto';

@Injectable()
export class TicketTypeService {
  async create(dto: CreateTicketTypeDto) {
    return prisma.ticketType.create({
      data: {
        eventId: dto.eventId,
        name: dto.name,
        price: dto.price,
        quota: dto.quota,
        rules: (dto.rules ?? Prisma.JsonNull) as Prisma.InputJsonValue,
        refundable: dto.refundable ?? true,
        transferable: dto.transferable ?? false,
      },
    });
  }

  async findAll(filter: FilterTicketTypeDto) {
    const where: Record<string, unknown> = {};
    if (filter.eventId) where.eventId = filter.eventId;

    const page = filter.page ?? 1;
    const limit = filter.limit ?? 20;
    const skip = (page - 1) * limit;

    const [items, total] = await Promise.all([
      prisma.ticketType.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: { event: { select: { id: true, name: true } } },
      }),
      prisma.ticketType.count({ where }),
    ]);

    return { data: items, total, page, limit };
  }

  async findOne(id: string) {
    const ticketType = await prisma.ticketType.findUnique({
      where: { id },
      include: { event: { select: { id: true, name: true } } },
    });
    if (!ticketType) throw new NotFoundException(`TicketType ${id} not found`);
    return ticketType;
  }

  async update(id: string, dto: UpdateTicketTypeDto) {
    await this.findOne(id);
    const data: Record<string, unknown> = {};
    if (dto.name !== undefined) data.name = dto.name;
    if (dto.price !== undefined) data.price = dto.price;
    if (dto.quota !== undefined) {
      const current = await prisma.ticketType.findUnique({ where: { id }, select: { soldCount: true } });
      if (dto.quota < current!.soldCount) {
        throw new BadRequestException('Quota cannot be less than sold count');
      }
      data.quota = dto.quota;
    }
    if (dto.rules !== undefined) data.rules = dto.rules as Prisma.InputJsonValue;
    if (dto.refundable !== undefined) data.refundable = dto.refundable;
    if (dto.transferable !== undefined) data.transferable = dto.transferable;

    return prisma.ticketType.update({ where: { id }, data });
  }

  async remove(id: string) {
    await this.findOne(id);
    return prisma.ticketType.delete({ where: { id } });
  }
}
