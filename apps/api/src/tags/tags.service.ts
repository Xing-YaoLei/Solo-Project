import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../common/prisma/prisma.service';

interface CreateTagDto {
  name: string;
  code: string;
  color: string;
  parentId?: string;
  sortOrder?: number;
}

interface UpdateTagDto {
  name?: string;
  code?: string;
  color?: string;
  parentId?: string;
  sortOrder?: number;
}

@Injectable()
export class TagsService {
  constructor(private prisma: PrismaService) {}

  async findAll() {
    return this.prisma.tag.findMany({
      orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }],
      include: { complaints: true },
    });
  }

  async findOne(id: string) {
    const tag = await this.prisma.tag.findUnique({
      where: { id },
      include: { complaints: true },
    });
    if (!tag) {
      throw new NotFoundException('标签不存在');
    }
    return tag;
  }

  async create(data: CreateTagDto) {
    const existing = await this.prisma.tag.findUnique({ where: { code: data.code } });
    if (existing) {
      throw new ConflictException('标签编码已存在');
    }
    return this.prisma.tag.create({ data });
  }

  async update(id: string, data: UpdateTagDto) {
    const existing = await this.prisma.tag.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundException('标签不存在');
    }
    if (data.code && data.code !== existing.code) {
      const duplicate = await this.prisma.tag.findUnique({ where: { code: data.code } });
      if (duplicate) {
        throw new ConflictException('标签编码已存在');
      }
    }
    return this.prisma.tag.update({ where: { id }, data });
  }

  async remove(id: string) {
    const existing = await this.prisma.tag.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundException('标签不存在');
    }
    return this.prisma.tag.delete({ where: { id } });
  }
}
