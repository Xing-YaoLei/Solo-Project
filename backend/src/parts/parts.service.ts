import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreatePartDto } from './dto/create-part.dto';
import { UpdatePartDto } from './dto/update-part.dto';
import { paginate } from '../common/utils/pagination';

@Injectable()
export class PartsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(createPartDto: CreatePartDto) {
    const existingPart = await this.prisma.part.findUnique({
      where: { partNumber: createPartDto.partNumber },
    });

    if (existingPart) {
      throw new ConflictException('配件编号已存在');
    }

    return this.prisma.part.create({
      data: createPartDto,
    });
  }

  async findAll(
    page: number,
    pageSize: number,
    keyword?: string,
    category?: string,
    lowStock?: boolean,
  ) {
    const skip = (page - 1) * pageSize;
    const where: any = {};

    if (keyword) {
      where.OR = [
        { partNumber: { contains: keyword } },
        { name: { contains: keyword } },
        { specification: { contains: keyword } },
        { supplier: { contains: keyword } },
      ];
    }

    if (category) {
      where.category = category;
    }

    if (lowStock) {
      where.stock = { lte: { $expr: { $toInt: '$minStock' } } };
    }

    const [total, parts] = await Promise.all([
      this.prisma.part.count({ where }),
      this.prisma.part.findMany({
        skip,
        take: pageSize,
        where,
        orderBy: {
          createdAt: 'desc',
        },
      }),
    ]);

    return paginate(parts, total, page, pageSize);
  }

  async findOne(id: string) {
    const part = await this.prisma.part.findUnique({
      where: { id },
    });

    if (!part) {
      throw new NotFoundException('配件不存在');
    }

    return part;
  }

  async findByPartNumber(partNumber: string) {
    return this.prisma.part.findUnique({
      where: { partNumber },
    });
  }

  async update(id: string, updatePartDto: UpdatePartDto) {
    const part = await this.prisma.part.findUnique({
      where: { id },
    });

    if (!part) {
      throw new NotFoundException('配件不存在');
    }

    if (
      updatePartDto.partNumber &&
      updatePartDto.partNumber !== part.partNumber
    ) {
      const existingPart = await this.prisma.part.findUnique({
        where: { partNumber: updatePartDto.partNumber },
      });

      if (existingPart) {
        throw new ConflictException('配件编号已存在');
      }
    }

    return this.prisma.part.update({
      where: { id },
      data: updatePartDto,
    });
  }

  async remove(id: string) {
    const part = await this.prisma.part.findUnique({
      where: { id },
    });

    if (!part) {
      throw new NotFoundException('配件不存在');
    }

    await this.prisma.part.delete({
      where: { id },
    });

    return { message: '删除成功' };
  }

  async updateStock(id: string, quantity: number) {
    const part = await this.prisma.part.findUnique({
      where: { id },
    });

    if (!part) {
      throw new NotFoundException('配件不存在');
    }

    return this.prisma.part.update({
      where: { id },
      data: {
        stock: {
          increment: quantity,
        },
      },
    });
  }
}
