import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateReminderDto, UpdateReminderStatusDto, BulkCheckDto } from './dto/reminder.dto';

@Injectable()
export class ReminderService {
  constructor(private prisma: PrismaService) {}

  async findAll(shift?: string, date?: string) {
    const where: Record<string, unknown> = {};
    if (shift) where.shift = shift;
    if (date) {
      const start = new Date(date);
      const end = new Date(date);
      end.setDate(end.getDate() + 1);
      where.scheduledTime = { gte: start, lt: end };
    }
    return this.prisma.medicationReminder.findMany({
      where,
      include: { elder: { select: { id: true, name: true, careLevel: true, roomNumber: true } } },
      orderBy: { scheduledTime: 'asc' },
    });
  }

  async updateStatus(id: string, dto: UpdateReminderStatusDto) {
    const data: Record<string, unknown> = { status: dto.status };
    if (dto.administeredBy) {
      data.administeredBy = dto.administeredBy;
      data.administeredAt = new Date();
    }
    if (dto.notes !== undefined) data.notes = dto.notes;
    return this.prisma.medicationReminder.update({ where: { id }, data });
  }

  async bulkCheck(dto: BulkCheckDto) {
    let elderIds = dto.elderIds;

    if (!elderIds || elderIds.length === 0) {
      const where: Record<string, unknown> = {};
      if (dto.shift) where.shift = dto.shift;
      if (dto.date) {
        const start = new Date(dto.date);
        const end = new Date(dto.date);
        end.setDate(end.getDate() + 1);
        where.scheduledTime = { gte: start, lt: end };
      }
      const reminders = await this.prisma.medicationReminder.findMany({
        where,
        select: { elderId: true },
        distinct: ['elderId'],
      });
      elderIds = reminders.map(r => r.elderId);
    }

    if (!elderIds || elderIds.length === 0) {
      return { mismatches: [] };
    }

    const elders = await this.prisma.elder.findMany({
      where: { id: { in: elderIds } },
      include: { medications: true },
    });

    const mismatches: Array<{
      elderId: string;
      elderName: string;
      careLevel: string;
      issues: string[];
    }> = [];

    for (const elder of elders) {
      const issues: string[] = [];
      const medCount = elder.medications.length;

      if (elder.careLevel === 'LEVEL_5' && medCount < 3) {
        issues.push('五级护理老人用药种类偏少');
      }
      if (elder.careLevel === 'LEVEL_1' && medCount > 5) {
        issues.push('一级护理老人用药种类偏多');
      }
      if (elder.fallRiskLevel === 'HIGH' && elder.medications.some(m => m.medicationName.includes('降压'))) {
        issues.push('高跌倒风险老人使用降压药需注意体位性低血压');
      }
      if (elder.medications.filter(m => m.status === 'PENDING').length > 5) {
        issues.push('待处理用药提醒过多');
      }

      if (issues.length > 0) {
        mismatches.push({
          elderId: elder.id,
          elderName: elder.name,
          careLevel: elder.careLevel,
          issues,
        });
      }
    }

    return { mismatches };
  }

  async create(dto: CreateReminderDto) {
    return this.prisma.medicationReminder.create({
      data: {
        elderId: dto.elderId,
        medicationName: dto.medicationName,
        dosage: dto.dosage,
        frequency: dto.frequency,
        scheduledTime: new Date(dto.scheduledTime),
        shift: dto.shift,
      },
    });
  }
}
