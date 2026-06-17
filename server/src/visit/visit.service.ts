import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateVisitDto } from './dto/visit.dto';

@Injectable()
export class VisitService {
  constructor(private prisma: PrismaService) {}

  async findAll(elderId?: string) {
    const where: Record<string, unknown> = {};
    if (elderId) where.elderId = elderId;
    return this.prisma.visitRecord.findMany({
      where,
      include: { elder: { select: { id: true, name: true } } },
      orderBy: { visitTime: 'desc' },
    });
  }

  async create(dto: CreateVisitDto) {
    return this.prisma.visitRecord.create({
      data: {
        elderId: dto.elderId,
        visitorName: dto.visitorName,
        relationship: dto.relationship,
        visitTime: new Date(dto.visitTime),
        duration: dto.duration ?? 0,
        notes: dto.notes ?? '',
      },
    });
  }
}
