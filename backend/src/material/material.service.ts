import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { RedisService } from '../redis/redis.service';

@Injectable()
export class MaterialService {
  constructor(
    private prisma: PrismaService,
    private redis: RedisService,
  ) {}

  async findAll(params?: { isCommon?: boolean; category?: string; keyword?: string }) {
    const cacheKey = `materials:all:${JSON.stringify(params)}`;
    const cached = await this.redis.get(cacheKey);
    
    if (cached) {
      return JSON.parse(cached);
    }

    const where: any = {};
    if (params?.isCommon !== undefined) where.isCommon = params.isCommon;
    if (params?.category) where.category = params.category;
    if (params?.keyword) {
      where.OR = [
        { name: { contains: params.keyword } },
        { sku: { contains: params.keyword } },
      ];
    }

    const materials = await this.prisma.material.findMany({
      where,
      orderBy: { name: 'asc' },
    });

    await this.redis.set(cacheKey, JSON.stringify(materials), 300);

    return materials;
  }

  async getCommonMaterials() {
    return this.findAll({ isCommon: true });
  }

  async findOne(id: string) {
    return this.prisma.material.findUnique({
      where: { id },
    });
  }

  async create(data: any) {
    const material = await this.prisma.material.create({ data });
    await this.redis.del('materials:all');
    return material;
  }

  async update(id: string, data: any) {
    const material = await this.prisma.material.update({
      where: { id },
      data,
    });
    await this.redis.del('materials:all');
    return material;
  }

  async remove(id: string) {
    await this.prisma.material.delete({ where: { id } });
    await this.redis.del('materials:all');
    return { success: true };
  }

  async getCategories() {
    const cacheKey = 'materials:categories';
    const cached = await this.redis.get(cacheKey);
    
    if (cached) {
      return JSON.parse(cached);
    }

    const materials = await this.prisma.material.findMany({
      select: { category: true },
      distinct: ['category'],
    });

    const categories = materials.map(m => m.category).filter(Boolean);
    
    await this.redis.set(cacheKey, JSON.stringify(categories), 600);

    return categories;
  }
}
