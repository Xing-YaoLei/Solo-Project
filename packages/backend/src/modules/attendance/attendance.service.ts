import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { AttendanceStatus, AttendanceRecord } from '@prisma/client';
import { CheckInDto, SignType } from './dto/check-in.dto';
import { CheckOutDto } from './dto/check-out.dto';
import { BatchRegisterDto, BatchAttendanceStatus } from './dto/batch-register.dto';
import { QueryAttendanceDto } from './dto/query-attendance.dto';
import { AttendanceStatsDto, AttendanceStatsResultDto } from './dto/attendance-stats.dto';
import { buildPaginatedResult, PaginatedResultDto } from '../../common/dto/pagination.dto';

@Injectable()
export class AttendanceService {
  constructor(private readonly prisma: PrismaService) {}

  async checkIn(dto: CheckInDto): Promise<AttendanceRecord> {
    const hearing = await this.prisma.hearing.findUnique({
      where: { id: dto.hearingId },
    });
    if (!hearing) {
      throw new NotFoundException('开庭不存在');
    }

    let status: AttendanceStatus = AttendanceStatus.ARRIVED;
    if (dto.signType === SignType.LEAVE) {
      status = AttendanceStatus.EXCUSED;
    } else if (hearing.startTime && new Date() > hearing.startTime) {
      status = AttendanceStatus.LATE;
    }

    let checkInTime: Date | undefined = new Date();
    if (dto.signType === SignType.LEAVE) {
      checkInTime = undefined;
    }

    return this.prisma.attendanceRecord.create({
      data: {
        hearingId: dto.hearingId,
        attendeeType: dto.attendeeType,
        userId: dto.userId,
        clientId: dto.clientId,
        personName: dto.personName,
        plannedRole: dto.plannedRole,
        status,
        checkInTime,
        signType: dto.signType,
        seatLocation: dto.seatLocation,
        remark: dto.remark,
        recordedBy: dto.recordedBy,
      },
    });
  }

  async checkOut(dto: CheckOutDto): Promise<AttendanceRecord> {
    const record = await this.prisma.attendanceRecord.findUnique({
      where: { id: dto.attendanceRecordId },
    });
    if (!record) {
      throw new NotFoundException('签到记录不存在');
    }

    if (!record.checkInTime) {
      throw new BadRequestException('未签到无法签退');
    }

    const hearing = await this.prisma.hearing.findUnique({
      where: { id: record.hearingId },
    });

    let status: AttendanceStatus = record.status;
    if (hearing && hearing.endTime && new Date() < hearing.endTime) {
      status = AttendanceStatus.LEAVE_EARLY;
    }

    return this.prisma.attendanceRecord.update({
      where: { id: dto.attendanceRecordId },
      data: {
        checkOutTime: new Date(),
        status,
        remark: dto.remark ? (record.remark ? `${record.remark}; ${dto.remark}` : dto.remark) : record.remark,
      },
    });
  }

  async batchRegister(dto: BatchRegisterDto): Promise<{ count: number; records: AttendanceRecord[] }> {
    const hearing = await this.prisma.hearing.findUnique({
      where: { id: dto.hearingId },
    });
    if (!hearing) {
      throw new NotFoundException('开庭不存在');
    }

    const now = new Date();
    const records: AttendanceRecord[] = [];

    for (const item of dto.items) {
      let status: AttendanceStatus;
      switch (item.status) {
        case BatchAttendanceStatus.ARRIVED:
          status = now > hearing.startTime ? AttendanceStatus.LATE : AttendanceStatus.ARRIVED;
          break;
        case BatchAttendanceStatus.LATE:
          status = AttendanceStatus.LATE;
          break;
        case BatchAttendanceStatus.ABSENT:
          status = AttendanceStatus.ABSENT;
          break;
        case BatchAttendanceStatus.EXCUSED:
          status = AttendanceStatus.EXCUSED;
          break;
        case BatchAttendanceStatus.LEAVE_EARLY:
          status = AttendanceStatus.LEAVE_EARLY;
          break;
        default:
          status = AttendanceStatus.ARRIVED;
      }

      const record = await this.prisma.attendanceRecord.create({
        data: {
          hearingId: dto.hearingId,
          attendeeType: item.attendeeType,
          userId: item.userId,
          clientId: item.clientId,
          personName: item.personName,
          plannedRole: item.plannedRole,
          status,
          checkInTime:
            status === AttendanceStatus.ABSENT || status === AttendanceStatus.EXCUSED ? undefined : now,
          signType: item.signType,
          remark: item.remark,
          recordedBy: dto.recordedBy,
        },
      });
      records.push(record);
    }

    return { count: records.length, records };
  }

  async findOne(id: string): Promise<AttendanceRecord> {
    const record = await this.prisma.attendanceRecord.findUnique({
      where: { id },
    });
    if (!record) {
      throw new NotFoundException('签到记录不存在');
    }
    return record;
  }

  async findAll(dto: QueryAttendanceDto): Promise<PaginatedResultDto<AttendanceRecord>> {
    const page = dto.page || 1;
    const limit = dto.limit || 20;
    const skip = (page - 1) * limit;

    const where: any = {};
    if (dto.hearingId) where.hearingId = dto.hearingId;
    if (dto.userId) where.userId = dto.userId;
    if (dto.clientId) where.clientId = dto.clientId;
    if (dto.attendeeType) where.attendeeType = dto.attendeeType;
    if (dto.status) where.status = dto.status;
    if (dto.signType) where.signType = dto.signType;

    const [list, total] = await Promise.all([
      this.prisma.attendanceRecord.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.attendanceRecord.count({ where }),
    ]);

    return buildPaginatedResult(list, total, page, limit);
  }

  async updateStatus(id: string, status: AttendanceStatus, remark?: string): Promise<AttendanceRecord> {
    const record = await this.prisma.attendanceRecord.findUnique({
      where: { id },
    });
    if (!record) {
      throw new NotFoundException('签到记录不存在');
    }

    return this.prisma.attendanceRecord.update({
      where: { id },
      data: {
        status,
        remark: remark ? (record.remark ? `${record.remark}; ${remark}` : remark) : record.remark,
      },
    });
  }

  async remove(id: string): Promise<void> {
    const record = await this.prisma.attendanceRecord.findUnique({
      where: { id },
    });
    if (!record) {
      throw new NotFoundException('签到记录不存在');
    }
    await this.prisma.attendanceRecord.delete({ where: { id } });
  }

  async getStats(dto: AttendanceStatsDto): Promise<AttendanceStatsResultDto> {
    const where: any = {};

    if (dto.hearingId) {
      where.hearingId = dto.hearingId;
    } else if (dto.startDate || dto.endDate) {
      where.OR = [];
      if (dto.startDate) {
        where.OR.push({
          hearing: {
            startTime: { gte: new Date(dto.startDate) },
          },
        });
      }
      if (dto.endDate) {
        where.OR.push({
          hearing: {
            startTime: { lte: new Date(dto.endDate) },
          },
        });
      }
    }

    if (dto.attendeeType) {
      where.attendeeType = dto.attendeeType;
    }

    const records = await this.prisma.attendanceRecord.findMany({ where });

    const result: AttendanceStatsResultDto = {
      total: records.length,
      arrived: 0,
      late: 0,
      absent: 0,
      excused: 0,
      leaveEarly: 0,
      notArrived: 0,
      signTypeStats: {},
      attendanceRate: 0,
    };

    for (const r of records) {
      switch (r.status) {
        case AttendanceStatus.ARRIVED:
          result.arrived++;
          break;
        case AttendanceStatus.LATE:
          result.late++;
          break;
        case AttendanceStatus.ABSENT:
          result.absent++;
          break;
        case AttendanceStatus.EXCUSED:
          result.excused++;
          break;
        case AttendanceStatus.LEAVE_EARLY:
          result.leaveEarly++;
          break;
        case AttendanceStatus.NOT_ARRIVED:
          result.notArrived++;
          break;
      }

      if (r.signType) {
        result.signTypeStats[r.signType] = (result.signTypeStats[r.signType] || 0) + 1;
      }
    }

    const effectiveTotal = result.total - result.excused;
    const attendedCount = result.arrived + result.late + result.leaveEarly;
    result.attendanceRate = effectiveTotal > 0 ? Math.round((attendedCount / effectiveTotal) * 100) : 0;

    return result;
  }

  async getSignTypes(): Promise<string[]> {
    const records = await this.prisma.attendanceRecord.findMany({
      where: { signType: { not: null } },
      distinct: ['signType'],
      select: { signType: true },
    });
    const builtIn = ['现场', '远程', '请假'];
    const fromDb = records.map((r) => r.signType).filter(Boolean) as string[];
    return Array.from(new Set([...builtIn, ...fromDb]));
  }
}
