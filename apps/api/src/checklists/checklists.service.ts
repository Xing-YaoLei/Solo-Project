import { Injectable, HttpException, HttpStatus, Logger } from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';
import { Prisma } from '@prisma/client';
import {
  CreateChecklistDto,
  UpdateChecklistDto,
  ExecuteChecklistDto,
  UpdateChecklistItemResultDto,
} from './dto';
import { PaginationDto, createPaginatedResult, PaginatedResult } from '@/common/dto/pagination.dto';

const checklistSelectFields = {
  id: true,
  title: true,
  description: true,
  category: true,
  version: true,
  isActive: true,
  createdAt: true,
  updatedAt: true,
  createdBy: {
    select: {
      id: true,
      username: true,
      fullName: true,
    },
  },
  items: {
    orderBy: { order: Prisma.SortOrder.asc },
    select: {
      id: true,
      order: true,
      content: true,
      requirement: true,
      evidenceNeeded: true,
    },
  },
  _count: {
    select: {
      executions: true,
    },
  },
};

@Injectable()
export class ChecklistsService {
  private readonly logger = new Logger(ChecklistsService.name);

  constructor(private readonly prisma: PrismaService) {}

  async create(createChecklistDto: CreateChecklistDto, userId: string) {
    const { items, ...data } = createChecklistDto;

    const checklist = await this.prisma.checklist.create({
      data: {
        ...data,
        createdById: userId,
        items: {
          create: items.map((item) => ({
            order: item.order,
            content: item.content,
            requirement: item.requirement,
            evidenceNeeded: item.evidenceNeeded,
          })),
        },
      },
      select: checklistSelectFields,
    });

    this.logger.log(`创建检查清单成功: ${checklist.title}`);
    return checklist;
  }

  async findAll(
    pagination: PaginationDto,
    filters?: {
      category?: string;
      isActive?: boolean;
    },
  ): Promise<PaginatedResult<any>> {
    const { skip, take, keyword, sortBy, sortOrder } = pagination;

    const where: any = {};
    if (filters?.category) where.category = filters.category;
    if (filters?.isActive !== undefined) where.isActive = filters.isActive;

    if (keyword) {
      where.OR = [
        { title: { contains: keyword, mode: 'insensitive' } },
        { description: { contains: keyword, mode: 'insensitive' } },
      ];
    }

    const [total, data] = await Promise.all([
      this.prisma.checklist.count({ where }),
      this.prisma.checklist.findMany({
        where,
        skip,
        take,
        orderBy: { [sortBy]: sortOrder as Prisma.SortOrder },
        select: checklistSelectFields,
      }),
    ]);

    return createPaginatedResult(data, total, pagination.page, pagination.pageSize);
  }

  async findOne(id: string) {
    const checklist = await this.prisma.checklist.findUnique({
      where: { id },
      select: checklistSelectFields,
    });

    if (!checklist) {
      throw new HttpException('检查清单不存在', HttpStatus.NOT_FOUND);
    }

    return checklist;
  }

  async update(id: string, updateChecklistDto: UpdateChecklistDto) {
    const { items, ...data } = updateChecklistDto;

    const existing = await this.prisma.checklist.findUnique({ where: { id } });
    if (!existing) {
      throw new HttpException('检查清单不存在', HttpStatus.NOT_FOUND);
    }

    const updateData: any = { ...data };

    if (items && items.length > 0) {
      updateData.items = {
        deleteMany: {},
        create: items.map((item) => ({
          order: item.order,
          content: item.content,
          requirement: item.requirement,
          evidenceNeeded: item.evidenceNeeded,
        })),
      };
    }

    const updated = await this.prisma.checklist.update({
      where: { id },
      data: updateData,
      select: checklistSelectFields,
    });

    this.logger.log(`更新检查清单成功: ${updated.title}`);
    return updated;
  }

  async remove(id: string) {
    const existing = await this.prisma.checklist.findUnique({ where: { id } });
    if (!existing) {
      throw new HttpException('检查清单不存在', HttpStatus.NOT_FOUND);
    }

    const executionCount = await this.prisma.checklistExecution.count({
      where: { checklistId: id },
    });
    if (executionCount > 0) {
      throw new HttpException('该清单已有执行记录，无法删除，请设为禁用', HttpStatus.BAD_REQUEST);
    }

    await this.prisma.checklistItem.deleteMany({ where: { checklistId: id } });
    await this.prisma.checklist.delete({ where: { id } });

    this.logger.log(`删除检查清单成功: ${existing.title}`);
    return { message: '检查清单已删除' };
  }

  async execute(checklistId: string, executeDto: ExecuteChecklistDto, userId: string) {
    const checklist = await this.prisma.checklist.findUnique({
      where: { id: checklistId },
      include: { items: true },
    });
    if (!checklist) {
      throw new HttpException('检查清单不存在', HttpStatus.NOT_FOUND);
    }

    const task = await this.prisma.auditTask.findUnique({
      where: { id: executeDto.taskId },
    });
    if (!task) {
      throw new HttpException('任务不存在', HttpStatus.NOT_FOUND);
    }

    const existing = await this.prisma.checklistExecution.findFirst({
      where: {
        checklistId,
        taskId: executeDto.taskId,
        completedAt: null,
      },
    });
    if (existing) {
      return existing;
    }

    const execution = await this.prisma.checklistExecution.create({
      data: {
        checklistId,
        taskId: executeDto.taskId,
        executedById: userId,
        results: {
          create: checklist.items.map((item) => ({
            itemId: item.id,
          })),
        },
      },
      select: {
        id: true,
        startedAt: true,
        completedAt: true,
        checklist: {
          select: { id: true, title: true },
        },
        task: {
          select: { id: true, taskNo: true, title: true },
        },
        executedBy: {
          select: { id: true, fullName: true },
        },
        results: {
          include: {
            item: {
              select: {
                id: true,
                order: true,
                content: true,
                requirement: true,
                evidenceNeeded: true,
              },
            },
          },
          orderBy: { item: { order: Prisma.SortOrder.asc } },
        },
      },
    });

    this.logger.log(`创建清单执行记录: ${checklist.title} -> 任务${task.taskNo}`);
    return execution;
  }

  async updateItemResult(updateDto: UpdateChecklistItemResultDto, userId: string) {
    const { executionId, itemId, isPass, remark, evidenceId } = updateDto;

    const execution = await this.prisma.checklistExecution.findUnique({
      where: { id: executionId },
    });
    if (!execution) {
      throw new HttpException('执行记录不存在', HttpStatus.NOT_FOUND);
    }

    const result = await this.prisma.checklistItemResult.updateMany({
      where: { executionId, itemId },
      data: {
        isPass,
        remark,
        evidenceId,
        checkedById: userId,
        checkedAt: new Date(),
      },
    });

    if (result.count === 0) {
      throw new HttpException('执行结果项不存在', HttpStatus.NOT_FOUND);
    }

    const allResults = await this.prisma.checklistItemResult.findMany({
      where: { executionId },
    });
    const allChecked = allResults.every((r) => r.isPass !== null && r.isPass !== undefined);
    if (allChecked) {
      await this.prisma.checklistExecution.update({
        where: { id: executionId },
        data: { completedAt: new Date() },
      });
    }

    return { message: '检查项结果已更新' };
  }

  async findExecutions(
    pagination: PaginationDto,
    filters?: {
      checklistId?: string;
      taskId?: string;
      executedById?: string;
    },
  ): Promise<PaginatedResult<any>> {
    const { skip, take, sortBy, sortOrder } = pagination;

    const where: any = {};
    if (filters?.checklistId) where.checklistId = filters.checklistId;
    if (filters?.taskId) where.taskId = filters.taskId;
    if (filters?.executedById) where.executedById = filters.executedById;

    const [total, data] = await Promise.all([
      this.prisma.checklistExecution.count({ where }),
      this.prisma.checklistExecution.findMany({
        where,
        skip,
        take,
        orderBy: { [sortBy]: sortOrder as Prisma.SortOrder },
        include: {
          checklist: { select: { id: true, title: true } },
          task: { select: { id: true, taskNo: true, title: true } },
          executedBy: { select: { id: true, fullName: true } },
          results: {
            include: {
              item: { select: { id: true, order: true, content: true } },
            },
          },
        },
      }),
    ]);

    return createPaginatedResult(data, total, pagination.page, pagination.pageSize);
  }
}
