import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateVisitResultDto, CreateProblemTagDto } from '@solo/shared';

@Injectable()
export class ConfigService {
  constructor(private prisma: PrismaService) {}

  async getVisitResults(includeInactive = false) {
    const where = includeInactive ? {} : { isActive: true };
    return this.prisma.visitResult.findMany({
      where,
      orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
    });
  }

  async createVisitResult(data: CreateVisitResultDto) {
    return this.prisma.visitResult.create({ data: data as any });
  }

  async updateVisitResult(id: string, data: Partial<CreateVisitResultDto & { isActive: boolean }>) {
    return this.prisma.visitResult.update({ where: { id }, data });
  }

  async deleteVisitResult(id: string) {
    return this.prisma.visitResult.update({ where: { id }, data: { isActive: false } });
  }

  async getProblemTags(includeInactive = false) {
    const where = includeInactive ? {} : { isActive: true };
    return this.prisma.problemTag.findMany({
      where,
      orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
    });
  }

  async createProblemTag(data: CreateProblemTagDto) {
    return this.prisma.problemTag.create({ data: data as any });
  }

  async updateProblemTag(id: string, data: Partial<CreateProblemTagDto & { isActive: boolean }>) {
    return this.prisma.problemTag.update({ where: { id }, data });
  }

  async deleteProblemTag(id: string) {
    return this.prisma.problemTag.update({ where: { id }, data: { isActive: false } });
  }

  async getAllConfig() {
    const [visitResults, problemTags] = await Promise.all([
      this.getVisitResults(),
      this.getProblemTags(),
    ]);
    return { visitResults, problemTags };
  }
}
