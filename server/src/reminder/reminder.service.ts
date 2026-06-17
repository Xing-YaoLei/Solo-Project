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
      return {
        totalElders: 0,
        matchedCount: 0,
        mismatchCount: 0,
        mismatches: [],
      };
    }

    const medicationsWhere: Record<string, unknown> = {};
    if (dto.shift) medicationsWhere.shift = dto.shift;
    if (dto.date) {
      const start = new Date(dto.date);
      const end = new Date(dto.date);
      end.setDate(end.getDate() + 1);
      medicationsWhere.scheduledTime = { gte: start, lt: end };
    }

    const elders = await this.prisma.elder.findMany({
      where: { id: { in: elderIds } },
      include: {
        medications: {
          where: medicationsWhere,
        },
      },
    });

    const mismatches: Array<{
      elderId: string;
      elderName: string;
      roomNumber: string;
      careLevel: string;
      fallRiskLevel: string;
      medicationCount: number;
      issues: string[];
    }> = [];

    const careLevelLabels: Record<string, string> = {
      LEVEL_1: '一级护理',
      LEVEL_2: '二级护理',
      LEVEL_3: '三级护理',
      LEVEL_4: '四级护理',
      LEVEL_5: '五级护理',
    };

    for (const elder of elders) {
      const issues: string[] = [];
      const medCount = elder.medications.length;
      const careLabel = careLevelLabels[elder.careLevel] ?? elder.careLevel;

      if (elder.careLevel === 'LEVEL_5' && medCount < 2) {
        issues.push(`${careLabel}老人用药种类偏少（仅 ${medCount} 种），建议复核用药清单`);
      }
      if (elder.careLevel === 'LEVEL_1' && medCount > 6) {
        issues.push(`${careLabel}老人用药种类偏多（${medCount} 种），需关注药物相互作用`);
      }
      if (elder.fallRiskLevel === 'HIGH' && elder.medications.some(m => 
        m.medicationName.includes('降压') || m.medicationName.includes('硝苯地平') || m.medicationName.includes('氨氯地平')
      )) {
        issues.push('高跌倒风险老人使用降压药，需警惕体位性低血压风险');
      }
      if (elder.fallRiskLevel === 'HIGH' && elder.medications.some(m => 
        m.medicationName.includes('安眠') || m.medicationName.includes('安定') || m.medicationName.includes('唑吡坦')
      )) {
        issues.push('高跌倒风险老人使用镇静催眠药，夜间跌倒风险增加');
      }
      if (elder.medications.filter(m => m.status === 'PENDING').length > 3) {
        issues.push('待处理用药提醒较多，建议优先处理');
      }
      if (elder.medications.some(m => m.status === 'MISSED')) {
        const missedCount = elder.medications.filter(m => m.status === 'MISSED').length;
        issues.push(`存在 ${missedCount} 条漏服记录，需跟进原因`);
      }
      if (elder.allergies.length > 0 && elder.medications.some(m => 
        elder.allergies.some(a => m.medicationName.includes(a))
      )) {
        issues.push('存在过敏史药物匹配警告，请立即核实');
      }

      if (issues.length > 0) {
        mismatches.push({
          elderId: elder.id,
          elderName: elder.name,
          roomNumber: elder.roomNumber,
          careLevel: elder.careLevel,
          fallRiskLevel: elder.fallRiskLevel,
          medicationCount: medCount,
          issues,
        });
      }
    }

    return {
      totalElders: elders.length,
      matchedCount: elders.length - mismatches.length,
      mismatchCount: mismatches.length,
      mismatches,
    };
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
