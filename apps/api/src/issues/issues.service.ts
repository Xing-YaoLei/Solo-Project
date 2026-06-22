import { Injectable, HttpException, HttpStatus, Logger } from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';
import { CreateIssueDto, UpdateIssueDto, MarkRecurredDto } from './dto';
import { PaginationDto, createPaginatedResult, PaginatedResult } from '@/common/dto/pagination.dto';
import { IssueSeverity, IssueStatus } from '@prisma/client';

const issueSelectFields = {
  id: true,
  issueNo: true,
  title: true,
  description: true,
  severity: true,
  status: true,
  isRecurred: true,
  recurrenceCount: true,
  category: true,
  subCategory: true,
  department: true,
  identifiedAt: true,
  resolvedAt: true,
  dueDate: true,
  createdAt: true,
  updatedAt: true,
  task: {
    select: { id: true, taskNo: true, title: true },
  },
  evidence: {
    select: { id: true, evidenceNo: true, title: true },
  },
  createdBy: {
    select: { id: true, fullName: true },
  },
  owner: {
    select: { id: true, fullName: true },
  },
  parentIssue: {
    select: { id: true, issueNo: true, title: true },
  },
};

@Injectable()
export class IssuesService {
  private readonly logger = new Logger(IssuesService.name);

  constructor(private readonly prisma: PrismaService) {}

  private async generateIssueNo(): Promise<string> {
    const year = new Date().getFullYear();
    const prefix = `IS${year}`;
    const last = await this.prisma.issue.findFirst({
      where: { issueNo: { startsWith: prefix } },
      orderBy: { issueNo: 'desc' },
    });
    let sequence = 1;
    if (last) {
      const match = last.issueNo.match(/(\d{6})$/);
      if (match) sequence = parseInt(match[1], 10) + 1;
    }
    return `${prefix}${String(sequence).padStart(6, '0')}`;
  }

  async create(createDto: CreateIssueDto, userId: string) {
    const { identifiedAt, dueDate, ...data } = createDto;
    const issueNo = await this.generateIssueNo();

    const isRecurred = !!createDto.parentIssueId;
    const parentIssue = isRecurred
      ? await this.prisma.issue.findUnique({ where: { id: createDto.parentIssueId } })
      : null;

    const result = await this.prisma.$transaction(async (tx) => {
      const issue = await tx.issue.create({
        data: {
          title: data.title,
          description: data.description,
          severity: data.severity,
          status: data.status,
          category: data.category,
          subCategory: data.subCategory,
          department: data.department,
          ownerId: data.ownerId,
          samplingItemId: data.samplingItemId,
          issueNo,
          isRecurred,
          createdById: userId,
          identifiedAt: identifiedAt ? new Date(identifiedAt) : undefined,
          dueDate: dueDate ? new Date(dueDate) : undefined,
          task: data.taskId ? { connect: { id: data.taskId } } : undefined,
          evidence: data.evidenceId ? { connect: { id: data.evidenceId } } : undefined,
          parentIssue: data.parentIssueId ? { connect: { id: data.parentIssueId } } : undefined,
        } as any,
        select: issueSelectFields,
      });

      if (isRecurred && parentIssue) {
        await tx.issue.update({
          where: { id: parentIssue.id },
          data: {
            recurrenceCount: parentIssue.recurrenceCount + 1,
            isRecurred: true,
          },
        });
      }

      return issue;
    });

    this.logger.log(`创建问题: ${result.issueNo}${isRecurred ? ' (复发)' : ''}`);
    return result;
  }

  async findAll(
    pagination: PaginationDto,
    filters?: {
      severity?: IssueSeverity;
      status?: IssueStatus;
      category?: string;
      subCategory?: string;
      department?: string;
      taskId?: string;
      ownerId?: string;
      isRecurred?: boolean;
      startDate?: string;
      endDate?: string;
    },
  ): Promise<PaginatedResult<any>> {
    const { skip, take, keyword, sortBy, sortOrder } = pagination;

    const where: any = {};
    if (filters?.severity) where.severity = filters.severity;
    if (filters?.status) where.status = filters.status;
    if (filters?.category) where.category = filters.category;
    if (filters?.subCategory) where.subCategory = filters.subCategory;
    if (filters?.department) where.department = filters.department;
    if (filters?.taskId) where.taskId = filters.taskId;
    if (filters?.ownerId) where.ownerId = filters.ownerId;
    if (filters?.isRecurred !== undefined) where.isRecurred = filters.isRecurred;

    if (filters?.startDate || filters?.endDate) {
      where.identifiedAt = {};
      if (filters.startDate) where.identifiedAt.gte = new Date(filters.startDate);
      if (filters.endDate) where.identifiedAt.lte = new Date(filters.endDate);
    }

    if (keyword) {
      where.OR = [
        { title: { contains: keyword, mode: 'insensitive' } },
        { issueNo: { contains: keyword, mode: 'insensitive' } },
        { description: { contains: keyword, mode: 'insensitive' } },
      ];
    }

    const [total, data] = await Promise.all([
      this.prisma.issue.count({ where }),
      this.prisma.issue.findMany({
        where,
        skip,
        take,
        orderBy: { [sortBy]: sortOrder },
        select: issueSelectFields,
      }),
    ]);

    return createPaginatedResult(data, total, pagination.page, pagination.pageSize);
  }

  async findOne(id: string) {
    const issue = await this.prisma.issue.findUnique({
      where: { id },
      select: {
        ...issueSelectFields,
        childIssues: {
          select: {
            id: true,
            issueNo: true,
            title: true,
            status: true,
            severity: true,
            identifiedAt: true,
          },
          orderBy: { identifiedAt: 'desc' },
        },
      },
    });

    if (!issue) {
      throw new HttpException('问题不存在', HttpStatus.NOT_FOUND);
    }

    return issue;
  }

  async findRecurrenceChain(id: string) {
    const visited = new Set<string>();
    const chain: any[] = [];

    let currentId: string | null = id;
    while (currentId && !visited.has(currentId)) {
      visited.add(currentId);
      const issue = await this.prisma.issue.findUnique({
        where: { id: currentId },
        select: {
          id: true,
          issueNo: true,
          title: true,
          severity: true,
          status: true,
          identifiedAt: true,
          resolvedAt: true,
          recurrenceCount: true,
          parentIssueId: true,
        },
      });
      if (!issue) break;
      chain.unshift(issue);
      currentId = issue.parentIssueId;
    }

    const startIssue = await this.prisma.issue.findUnique({ where: { id } });
    if (startIssue) {
      const childChain: any[] = [];
      await this.collectChildIssues(id, childChain, visited);
      childChain.forEach((child) => chain.push(child));
    }

    return {
      chain,
      totalRecurrences: chain.length - 1,
      startIssue: chain.find((i) => i.id === id),
      rootIssue: chain[0],
    };
  }

  private async collectChildIssues(parentId: string, chain: any[], visited: Set<string>) {
    const children = await this.prisma.issue.findMany({
      where: { parentIssueId: parentId },
      select: {
        id: true,
        issueNo: true,
        title: true,
        severity: true,
        status: true,
        identifiedAt: true,
        resolvedAt: true,
        recurrenceCount: true,
        parentIssueId: true,
      },
    });

    for (const child of children) {
      if (!visited.has(child.id)) {
        visited.add(child.id);
        chain.push(child);
        await this.collectChildIssues(child.id, chain, visited);
      }
    }
  }

  async update(id: string, updateDto: UpdateIssueDto) {
    const existing = await this.prisma.issue.findUnique({ where: { id } });
    if (!existing) {
      throw new HttpException('问题不存在', HttpStatus.NOT_FOUND);
    }

    const { dueDate, resolvedAt, ...data } = updateDto;
    const updateData: any = { ...data };
    if (dueDate) updateData.dueDate = new Date(dueDate);
    if (resolvedAt) updateData.resolvedAt = new Date(resolvedAt);

    const updated = await this.prisma.issue.update({
      where: { id },
      data: updateData,
      select: issueSelectFields,
    });

    this.logger.log(`更新问题: ${updated.issueNo}`);
    return updated;
  }

  async markRecurred(id: string, markDto: MarkRecurredDto, userId: string) {
    const existing = await this.prisma.issue.findUnique({ where: { id } });
    if (!existing) {
      throw new HttpException('问题不存在', HttpStatus.NOT_FOUND);
    }
    if (existing.isRecurred && existing.parentIssueId) {
      throw new HttpException('该问题已被标记为复发', HttpStatus.BAD_REQUEST);
    }

    const parent = await this.prisma.issue.findUnique({
      where: { id: markDto.parentIssueId },
    });
    if (!parent) {
      throw new HttpException('父问题不存在', HttpStatus.NOT_FOUND);
    }

    const result = await this.prisma.$transaction(async (tx) => {
      const updated = await tx.issue.update({
        where: { id },
        data: {
          isRecurred: true,
          parentIssueId: markDto.parentIssueId,
        },
        select: issueSelectFields,
      });

      await tx.issue.update({
        where: { id: markDto.parentIssueId },
        data: {
          recurrenceCount: parent.recurrenceCount + 1,
          isRecurred: true,
        },
      });

      return updated;
    });

    this.logger.log(`标记问题复发: ${existing.issueNo} -> 父问题: ${parent.issueNo}`);
    return result;
  }

  async remove(id: string) {
    const existing = await this.prisma.issue.findUnique({ where: { id } });
    if (!existing) {
      throw new HttpException('问题不存在', HttpStatus.NOT_FOUND);
    }

    await this.prisma.issue.updateMany({
      where: { parentIssueId: id },
      data: { parentIssueId: null },
    });

    await this.prisma.issue.delete({ where: { id } });

    this.logger.log(`删除问题: ${existing.issueNo}`);
    return { message: '问题已删除' };
  }
}
