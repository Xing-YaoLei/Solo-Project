import { Injectable, HttpException, HttpStatus, Logger } from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';
import { CreateReviewDto } from './dto/create-review.dto';
import { PaginationDto, createPaginatedResult, PaginatedResult } from '@/common/dto/pagination.dto';
import {
  ReviewResult, ReviewTargetType, EvidenceStatus, TaskStatus } from '@prisma/client';

const reviewSelectFields = {
  id: true,
  targetType: true,
  targetId: true,
  result: true,
  comment: true,
  reviewRound: true,
  reviewedAt: true,
  createdAt: true,
  snapshot: true,
  reviewer: {
    select: {
      id: true,
      username: true,
      fullName: true,
      role: true,
    },
  },
  evidence: {
    select: { id: true, evidenceNo: true, title: true },
  },
  task: {
    select: { id: true, taskNo: true, title: true },
  },
};

@Injectable()
export class ReviewsService {
  private readonly logger = new Logger(ReviewsService.name);

  constructor(private readonly prisma: PrismaService) {}

  private async getTargetSnapshot(targetType: ReviewTargetType, targetId: string) {
    switch (targetType) {
      case ReviewTargetType.EVIDENCE:
        return this.prisma.evidence.findUnique({ where: { id: targetId } });
      case ReviewTargetType.TASK:
        return this.prisma.auditTask.findUnique({ where: { id: targetId } });
      default:
        return null;
    }
  }

  private getNextReviewRound(targetType: ReviewTargetType, targetId: string): Promise<number> {
    return this.prisma.reviewRecord
      .count({
        where: { targetType, targetId },
      })
      .then((count) => count + 1);
  }

  async create(createReviewDto: CreateReviewDto, reviewerId: string) {
    const { targetType, targetId, result, comment } = createReviewDto;

    const target = await this.getTargetSnapshot(targetType, targetId);
    if (!target) {
      throw new HttpException('复核目标不存在', HttpStatus.NOT_FOUND);
    }

    const reviewRound = await this.getNextReviewRound(targetType, targetId);

    const targetData: any = {
      targetType,
      targetId,
      result,
      comment,
      reviewerId,
      reviewRound,
      snapshot: target,
    };

    let evidenceId: string | undefined;
    let taskId: string | undefined;

    if (targetType === ReviewTargetType.EVIDENCE) {
      evidenceId = targetId;
      const evidence = target as any;
      taskId = evidence.taskId;

      const evidenceData: any = {};
      switch (result) {
        case ReviewResult.APPROVED:
          evidenceData.status = EvidenceStatus.APPROVED;
          evidenceData.archivedAt = new Date();
          break;
        case ReviewResult.REJECTED:
          evidenceData.status = EvidenceStatus.REJECTED;
          break;
        case ReviewResult.NEED_REVISION:
          evidenceData.status = EvidenceStatus.DRAFT;
          break;
      }

      const task = await this.prisma.auditTask.findUnique({
        where: { id: taskId },
        include: { evidences: true },
      });

      if (task) {
        const evidenceStatuses = task.evidences
          .filter((e) => e.id !== targetId)
          .map((e) => e.status);
        evidenceStatuses.push(evidenceData.status);

        if (evidenceStatuses.every((s) => s === EvidenceStatus.APPROVED) && task.status !== TaskStatus.REVIEWING) {
          const updatedTask = await this.prisma.auditTask.update({
            where: { id: taskId },
            data: {
              status: TaskStatus.APPROVED,
              completedAt: new Date(),
            },
          });
          this.logger.log(`任务[${task.taskNo}]所有证据已通过复核，任务已完成`);
        }
      }

      await this.prisma.evidence.update({
        where: { id: targetId },
        data: evidenceData,
      });
    }

    if (targetType === ReviewTargetType.TASK) {
      taskId = targetId;
      const task = target as any;

      const taskData: any = {};
      switch (result) {
        case ReviewResult.APPROVED:
          taskData.status = TaskStatus.APPROVED;
          taskData.completedAt = new Date();
          break;
        case ReviewResult.REJECTED:
          taskData.status = TaskStatus.REJECTED;
          break;
        case ReviewResult.NEED_REVISION:
          taskData.status = TaskStatus.IN_PROGRESS;
          break;
      }

      await this.prisma.auditTask.update({
        where: { id: targetId },
        data: taskData,
      });
    }

    if (evidenceId) targetData.evidenceId = evidenceId;
    if (taskId) targetData.taskId = taskId;

    const review = await this.prisma.reviewRecord.create({
      data: targetData,
      select: reviewSelectFields,
    });

    this.logger.log(
      `复核完成: ${targetType}[${targetId}] 结果:${result} 轮次:${reviewRound}`,
    );

    return review;
  }

  async findAll(
    pagination: PaginationDto,
    filters?: {
      targetType?: ReviewTargetType;
      targetId?: string;
      result?: ReviewResult;
      reviewerId?: string;
      taskId?: string;
      evidenceId?: string;
    },
  ): Promise<PaginatedResult<any>> {
    const { skip, take, keyword, sortBy, sortOrder } = pagination;

    const where: any = {};

    if (filters?.targetType) where.targetType = filters.targetType;
    if (filters?.targetId) where.targetId = filters.targetId;
    if (filters?.result) where.result = filters.result;
    if (filters?.reviewerId) where.reviewerId = filters.reviewerId;
    if (filters?.taskId) where.taskId = filters.taskId;
    if (filters?.evidenceId) where.evidenceId = filters.evidenceId;

    const [total, data] = await Promise.all([
      this.prisma.reviewRecord.count({ where }),
      this.prisma.reviewRecord.findMany({
        where,
        skip,
        take,
        orderBy: { [sortBy]: sortOrder },
        select: reviewSelectFields,
      }),
    ]);

    return createPaginatedResult(data, total, pagination.page, pagination.pageSize);
  }

  async findOne(id: string) {
    const review = await this.prisma.reviewRecord.findUnique({
      where: { id },
      select: reviewSelectFields,
    });

    if (!review) {
      throw new HttpException('复核记录不存在', HttpStatus.NOT_FOUND);
    }

    return review;
  }

  async findByTarget(targetType: ReviewTargetType, targetId: string) {
    return this.prisma.reviewRecord.findMany({
      where: { targetType, targetId },
      orderBy: { reviewRound: 'asc' },
      select: reviewSelectFields,
    });
  }

  async getReviewHistory(targetType: ReviewTargetType, targetId: string) {
    const reviews = await this.findByTarget(targetType, targetId);

    const latestReview = reviews[reviews.length - 1];
    const currentStatus = latestReview?.result;

    return {
      totalRounds: reviews.length,
      latestResult: currentStatus,
      latestReview,
      allReviews: reviews,
      summary: {
        approved: reviews.filter((r) => r.result === ReviewResult.APPROVED).length,
        rejected: reviews.filter((r) => r.result === ReviewResult.REJECTED).length,
        needRevision: reviews.filter((r) => r.result === ReviewResult.NEED_REVISION).length,
      },
    };
  }
}
