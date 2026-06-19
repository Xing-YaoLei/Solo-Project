import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateQualityCheckDto } from './dto/create-quality-check.dto';
import { paginate } from '../common/utils/pagination';

@Injectable()
export class QualityChecksService {
  constructor(private readonly prisma: PrismaService) {}

  async create(createQualityCheckDto: CreateQualityCheckDto) {
    return this.prisma.qualityCheck.create({
      data: createQualityCheckDto,
      include: {
        workOrder: {
          select: {
            id: true,
            orderNumber: true,
          },
        },
        inspector: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });
  }

  async findAll(
    page: number,
    pageSize: number,
    workOrderId?: string,
  ) {
    const skip = (page - 1) * pageSize;
    const where: any = {};

    if (workOrderId) {
      where.workOrderId = workOrderId;
    }

    const [total, qualityChecks] = await Promise.all([
      this.prisma.qualityCheck.count({ where }),
      this.prisma.qualityCheck.findMany({
        skip,
        take: pageSize,
        where,
        include: {
          workOrder: {
            select: {
              id: true,
              orderNumber: true,
            },
          },
          inspector: {
            select: {
              id: true,
              name: true,
            },
          },
        },
        orderBy: {
          checkDate: 'desc',
        },
      }),
    ]);

    return paginate(qualityChecks, total, page, pageSize);
  }

  async findOne(id: string) {
    const qualityCheck = await this.prisma.qualityCheck.findUnique({
      where: { id },
      include: {
        workOrder: {
          include: {
            vehicle: true,
          },
        },
        inspector: {
          select: {
            id: true,
            name: true,
            username: true,
          },
        },
      },
    });

    if (!qualityCheck) {
      throw new NotFoundException('质检记录不存在');
    }

    return qualityCheck;
  }

  async remove(id: string) {
    const qualityCheck = await this.prisma.qualityCheck.findUnique({
      where: { id },
    });

    if (!qualityCheck) {
      throw new NotFoundException('质检记录不存在');
    }

    await this.prisma.qualityCheck.delete({
      where: { id },
    });

    return { message: '删除成功' };
  }
}
