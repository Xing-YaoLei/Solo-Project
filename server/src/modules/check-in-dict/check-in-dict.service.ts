import { Injectable, NotFoundException, BadRequestException, ConflictException } from '@nestjs/common';
import { prisma } from '../../prisma';
import {
  CreateCheckInDictDto,
  UpdateCheckInDictDto,
  FilterCheckInDictDto,
  CreateCheckInRecordDto,
  FilterCheckInRecordDto,
} from './check-in-dict.dto';

@Injectable()
export class CheckInDictService {
  async createDict(dto: CreateCheckInDictDto) {
    const existing = await prisma.checkInDict.findUnique({ where: { code: dto.code } });
    if (existing) throw new ConflictException(`Code ${dto.code} already exists`);
    return prisma.checkInDict.create({ data: dto });
  }

  async findAllDicts(filter: FilterCheckInDictDto) {
    const where: Record<string, unknown> = {};
    if (filter.category) where.category = filter.category;
    if (filter.isActive !== undefined) where.isActive = filter.isActive;

    const page = filter.page ?? 1;
    const limit = filter.limit ?? 20;
    const skip = (page - 1) * limit;

    const [items, total] = await Promise.all([
      prisma.checkInDict.findMany({ where, skip, take: limit, orderBy: { createdAt: 'desc' } }),
      prisma.checkInDict.count({ where }),
    ]);

    return { items, total, page, limit };
  }

  async updateDict(id: string, dto: UpdateCheckInDictDto) {
    await this.findOneDict(id);
    return prisma.checkInDict.update({ where: { id }, data: dto });
  }

  async removeDict(id: string) {
    await this.findOneDict(id);
    return prisma.checkInDict.update({ where: { id }, data: { isActive: false } });
  }

  async findOneDict(id: string) {
    const dict = await prisma.checkInDict.findUnique({ where: { id } });
    if (!dict) throw new NotFoundException(`CheckInDict ${id} not found`);
    return dict;
  }

  async createRecord(dto: CreateCheckInRecordDto) {
    const orderItem = await prisma.orderItem.findUnique({ where: { id: dto.orderItemId } });
    if (!orderItem) throw new NotFoundException(`OrderItem ${dto.orderItemId} not found`);
    if (orderItem.status !== 'valid') {
      throw new BadRequestException(`OrderItem ${dto.orderItemId} is not valid for check-in`);
    }

    const existingRecord = await prisma.checkInRecord.findUnique({ where: { orderItemId: dto.orderItemId } });
    if (existingRecord) throw new ConflictException(`OrderItem ${dto.orderItemId} already checked in`);

    const dict = await prisma.checkInDict.findUnique({ where: { code: dto.dictCode } });
    if (!dict) throw new NotFoundException(`CheckInDict code ${dto.dictCode} not found`);
    if (!dict.isActive) throw new BadRequestException(`CheckInDict code ${dto.dictCode} is not active`);

    return prisma.checkInRecord.create({ data: dto });
  }

  async findAllRecords(filter: FilterCheckInRecordDto) {
    const where: Record<string, unknown> = {};
    if (filter.dictCode) where.dictCode = filter.dictCode;
    if (filter.checkedBy) where.checkedBy = filter.checkedBy;

    if (filter.dateFrom || filter.dateTo) {
      where.checkedAt = {
        ...(filter.dateFrom && { gte: new Date(filter.dateFrom) }),
        ...(filter.dateTo && { lte: new Date(filter.dateTo) }),
      };
    }

    const page = filter.page ?? 1;
    const limit = filter.limit ?? 20;
    const skip = (page - 1) * limit;

    const [items, total] = await Promise.all([
      prisma.checkInRecord.findMany({
        where,
        skip,
        take: limit,
        orderBy: { checkedAt: 'desc' },
        include: {
          orderItem: { select: { id: true, status: true } },
          dict: { select: { id: true, code: true, label: true } },
          checker: { select: { id: true, name: true, email: true } },
        },
      }),
      prisma.checkInRecord.count({ where }),
    ]);

    return { items, total, page, limit };
  }
}
