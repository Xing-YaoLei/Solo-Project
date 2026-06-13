import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ResponsibilityParty } from '@prisma/client';
import { CreateResponsibilityRuleDto } from '@solo/shared';

interface RuleMatchParams {
  problemTags: string[];
  visitResult?: string;
  region: string;
}

interface RuleMatchResult {
  responsibility: ResponsibilityParty | null;
  assigneeId: string | null;
  matchedRuleId: string | null;
  matchedRuleName: string | null;
}

@Injectable()
export class ResponsibilityRuleService {
  constructor(private prisma: PrismaService) {}

  async findAll(params: { isActive?: boolean; page?: number; pageSize?: number }) {
    const { page = 1, pageSize = 20, isActive } = params;
    const where: any = {};
    if (isActive !== undefined) where.isActive = isActive;

    const [total, items] = await Promise.all([
      this.prisma.responsibilityRule.count({ where }),
      this.prisma.responsibilityRule.findMany({
        where,
        include: { assignee: { select: { id: true, name: true } } },
        skip: (page - 1) * pageSize,
        take: pageSize,
        orderBy: [{ priority: 'desc' }, { createdAt: 'desc' }],
      }),
    ]);

    return { total, page, pageSize, items };
  }

  async findOne(id: string) {
    return this.prisma.responsibilityRule.findUnique({
      where: { id },
      include: { assignee: { select: { id: true, name: true } } },
    });
  }

  async create(data: CreateResponsibilityRuleDto) {
    return this.prisma.responsibilityRule.create({ data: data as any });
  }

  async update(id: string, data: Partial<CreateResponsibilityRuleDto & { isActive: boolean }>) {
    return this.prisma.responsibilityRule.update({ where: { id }, data });
  }

  async delete(id: string) {
    return this.prisma.responsibilityRule.update({ where: { id }, data: { isActive: false } });
  }

  async matchRule(params: RuleMatchParams): Promise<RuleMatchResult> {
    const { problemTags, visitResult, region } = params;

    const rules = await this.prisma.responsibilityRule.findMany({
      where: { isActive: true },
      orderBy: [{ priority: 'desc' }, { createdAt: 'asc' }],
    });

    for (const rule of rules) {
      let matches = true;

      if (rule.problemTags.length > 0) {
        const hasMatchingTag = problemTags.some((tag) => rule.problemTags.includes(tag));
        if (!hasMatchingTag) matches = false;
      }

      if (matches && rule.visitResults.length > 0 && visitResult) {
        if (!rule.visitResults.includes(visitResult)) matches = false;
      }

      if (matches && rule.regions.length > 0) {
        if (!rule.regions.includes(region)) matches = false;
      }

      if (matches) {
        return {
          responsibility: rule.responsibility,
          assigneeId: rule.assigneeId,
          matchedRuleId: rule.id,
          matchedRuleName: rule.name,
        };
      }
    }

    return {
      responsibility: null,
      assigneeId: null,
      matchedRuleId: null,
      matchedRuleName: null,
    };
  }

  async matchAndApplyRule(refundOrderId: string, params: RuleMatchParams, operatorId?: string) {
    const result = await this.matchRule(params);
    if (result.responsibility || result.assigneeId) {
      const updateData: any = {};
      if (result.responsibility) updateData.responsibility = result.responsibility;
      if (result.assigneeId) updateData.assigneeId = result.assigneeId;

      const updated = await this.prisma.refundOrder.update({
        where: { id: refundOrderId },
        data: updateData,
      });

      return { order: updated, rule: result };
    }
    return { order: null, rule: result };
  }
}
