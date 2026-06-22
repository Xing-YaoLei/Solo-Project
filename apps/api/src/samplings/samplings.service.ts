import { Injectable, HttpException, HttpStatus, Logger } from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';
import { CreateSamplingDto, UpdateSamplingDto } from './dto';
import { PaginationDto, createPaginatedResult, PaginatedResult } from '@/common/dto/pagination.dto';
import { SamplingStatus } from '@prisma/client';

const samplingSelectFields = {
  id: true,
  samplingNo: true,
  title: true,
  taskId: true,
  method: true,
  population: true,
  sampleSize: true,
  confidenceLevel: true,
  status: true,
  remark: true,
  createdAt: true,
  updatedAt: true,
  approvedAt: true,
  task: {
    select: {
      id: true,
      taskNo: true,
      title: true,
    },
  },
  createdBy: {
    select: {
      id: true,
      username: true,
      fullName: true,
    },
  },
  approvedBy: {
    select: {
      id: true,
      username: true,
      fullName: true,
    },
  },
  _count: {
    select: {
      samples: true,
    },
  },
};

@Injectable()
export class SamplingsService {
  private readonly logger = new Logger(SamplingsService.name);

  constructor(private readonly prisma: PrismaService) {}

  private async generateSamplingNo(): Promise<string> {
    const year = new Date().getFullYear();
    const prefix = `SM${year}`;
    const last = await this.prisma.samplingRecord.findFirst({
      where: { samplingNo: { startsWith: prefix } },
      orderBy: { samplingNo: 'desc' },
    });
    let sequence = 1;
    if (last) {
      const match = last.samplingNo.match(/(\d{5})$/);
      if (match) sequence = parseInt(match[1], 10) + 1;
    }
    return `${prefix}${String(sequence).padStart(5, '0')}`;
  }

  async create(createSamplingDto: CreateSamplingDto, userId: string) {
    const task = await this.prisma.auditTask.findUnique({
      where: { id: createSamplingDto.taskId },
    });
    if (!task) {
      throw new HttpException('关联任务不存在', HttpStatus.NOT_FOUND);
    }

    const { samples, ...data } = createSamplingDto;
    const samplingNo = await this.generateSamplingNo();

    const sampling = await this.prisma.samplingRecord.create({
      data: {
        ...data,
        samplingNo,
        createdById: userId,
        samples: samples?.length
          ? {
              create: samples.map((s) => ({
                itemNo: s.itemNo,
                documentNo: s.documentNo,
                description: s.description,
                amount: s.amount,
                isDefect: s.isDefect,
                defectType: s.defectType,
                defectLevel: s.defectLevel,
                remark: s.remark,
                evidenceId: s.evidenceId,
              })),
            }
          : undefined,
      },
      select: samplingSelectFields,
    });

    this.logger.log(`创建抽样记录成功: ${sampling.samplingNo}`);
    return sampling;
  }

  async findAll(
    pagination: PaginationDto,
    filters?: {
      status?: SamplingStatus;
      taskId?: string;
      createdById?: string;
    },
  ): Promise<PaginatedResult<any>> {
    const { skip, take, keyword, sortBy, sortOrder } = pagination;
    const where: any = {};
    if (filters?.status) where.status = filters.status;
    if (filters?.taskId) where.taskId = filters.taskId;
    if (filters?.createdById) where.createdById = filters.createdById;

    if (keyword) {
      where.OR = [
        { title: { contains: keyword, mode: 'insensitive' } },
        { samplingNo: { contains: keyword, mode: 'insensitive' } },
      ];
    }

    const [total, data] = await Promise.all([
      this.prisma.samplingRecord.count({ where }),
      this.prisma.samplingRecord.findMany({
        where,
        skip,
        take,
        orderBy: { [sortBy]: sortOrder },
        select: samplingSelectFields,
      }),
    ]);

    return createPaginatedResult(data, total, pagination.page, pagination.pageSize);
  }

  async findOne(id: string) {
    const sampling = await this.prisma.samplingRecord.findUnique({
      where: { id },
      select: {
        ...samplingSelectFields,
        samples: {
          orderBy: { itemNo: 'asc' },
          select: {
            id: true,
            itemNo: true,
            documentNo: true,
            description: true,
            amount: true,
            isDefect: true,
            defectType: true,
            defectLevel: true,
            remark: true,
            evidenceId: true,
            createdAt: true,
            evidence: {
              select: { id: true, evidenceNo: true, title: true },
            },
          },
        },
      },
    });

    if (!sampling) {
      throw new HttpException('抽样记录不存在', HttpStatus.NOT_FOUND);
    }

    const defectCount = sampling.samples.filter((s) => s.isDefect).length;
    const defectRate = sampling.samples.length
      ? (defectCount / sampling.samples.length) * 100
      : 0;

    return {
      ...sampling,
      stats: {
        defectCount,
        totalSamples: sampling.samples.length,
        defectRate: `${defectRate.toFixed(2)}%`,
      },
    };
  }

  async update(id: string, updateSamplingDto: UpdateSamplingDto) {
    const existing = await this.prisma.samplingRecord.findUnique({ where: { id } });
    if (!existing) {
      throw new HttpException('抽样记录不存在', HttpStatus.NOT_FOUND);
    }

    const { samples, ...data } = updateSamplingDto;
    const updateData: any = { ...data };

    if (samples) {
      updateData.samples = {
        deleteMany: {},
        create: samples.map((s) => ({
          itemNo: s.itemNo,
          documentNo: s.documentNo,
          description: s.description,
          amount: s.amount,
          isDefect: s.isDefect,
          defectType: s.defectType,
          defectLevel: s.defectLevel,
          remark: s.remark,
          evidenceId: s.evidenceId,
        })),
      };
    }

    const updated = await this.prisma.samplingRecord.update({
      where: { id },
      data: updateData,
      select: samplingSelectFields,
    });

    this.logger.log(`更新抽样记录成功: ${updated.samplingNo}`);
    return updated;
  }

  async remove(id: string) {
    const existing = await this.prisma.samplingRecord.findUnique({ where: { id } });
    if (!existing) {
      throw new HttpException('抽样记录不存在', HttpStatus.NOT_FOUND);
    }
    if (existing.status !== SamplingStatus.DRAFT && existing.status !== SamplingStatus.REJECTED) {
      throw new HttpException('只有草稿或已驳回的抽样可以删除', HttpStatus.BAD_REQUEST);
    }

    await this.prisma.samplingItem.deleteMany({ where: { samplingId: id } });
    await this.prisma.samplingRecord.delete({ where: { id } });

    this.logger.log(`删除抽样记录成功: ${existing.samplingNo}`);
    return { message: '抽样记录已删除' };
  }

  async approve(id: string, userId: string) {
    const existing = await this.prisma.samplingRecord.findUnique({ where: { id } });
    if (!existing) {
      throw new HttpException('抽样记录不存在', HttpStatus.NOT_FOUND);
    }
    if (existing.status !== SamplingStatus.COMPLETED) {
      throw new HttpException('只有已完成的抽样可以审批', HttpStatus.BAD_REQUEST);
    }

    const updated = await this.prisma.samplingRecord.update({
      where: { id },
      data: {
        status: SamplingStatus.APPROVED,
        approvedById: userId,
        approvedAt: new Date(),
      },
      select: samplingSelectFields,
    });

    this.logger.log(`审批抽样记录通过: ${updated.samplingNo}`);
    return updated;
  }

  async reject(id: string) {
    const existing = await this.prisma.samplingRecord.findUnique({ where: { id } });
    if (!existing) {
      throw new HttpException('抽样记录不存在', HttpStatus.NOT_FOUND);
    }
    if (existing.status !== SamplingStatus.COMPLETED) {
      throw new HttpException('只有已完成的抽样可以审批', HttpStatus.BAD_REQUEST);
    }

    const updated = await this.prisma.samplingRecord.update({
      where: { id },
      data: {
        status: SamplingStatus.REJECTED,
      },
      select: samplingSelectFields,
    });

    this.logger.log(`审批抽样记录驳回: ${updated.samplingNo}`);
    return updated;
  }
}
