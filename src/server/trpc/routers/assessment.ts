import { z } from 'zod';
import { TRPCError } from '@trpc/server';
import { createTRPCRouter, protectedProcedure, createRoleMiddleware } from '../trpc';
import type { Assessment, AssessmentStatus, PaginatedResult } from '../../../shared/types';
import {
  mockAssessments,
  mockElders,
  mockCareLevels,
  mockFlowHandlers,
  generateId
} from '../mockData';

let assessmentsData: Assessment[] = [...mockAssessments];
const flowHandlers = [...mockFlowHandlers];

const STATUS_FLOW: AssessmentStatus[] = ['draft', 'collecting', 'evaluating', 'approving', 'archived', 'closed'];
const STEP_NAMES = ['草稿', '信息采集', '等级评定', '审批', '归档', '已关闭'];

const supervisorOrAdmin = createRoleMiddleware('supervisor', 'admin');
const nurseOrAbove = createRoleMiddleware('nurse', 'supervisor', 'doctor', 'admin');

function calculateSuggestedLevel(totalScore: number) {
  const avg = totalScore / 4;
  return mockCareLevels.find(
    (cl) => cl.isActive && avg >= cl.scoreRange.min && avg <= cl.scoreRange.max
  ) ?? null;
}

export const assessmentRouter = createTRPCRouter({
  list: protectedProcedure
    .input(
      z.object({
        elderId: z.string().min(1).optional(),
        status: z.enum(['draft', 'collecting', 'evaluating', 'approving', 'archived', 'closed']).optional(),
        page: z.number().min(1).default(1),
        pageSize: z.number().min(1).max(100).default(10)
      })
    )
    .query(({ input }): PaginatedResult<Assessment> => {
      let filtered = [...assessmentsData];

      if (input.elderId) {
        filtered = filtered.filter((a) => a.elderId === input.elderId);
      }
      if (input.status) {
        filtered = filtered.filter((a) => a.status === input.status);
      }

      filtered.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

      const total = filtered.length;
      const start = (input.page - 1) * input.pageSize;
      const items = filtered.slice(start, start + input.pageSize);

      return {
        items,
        total,
        page: input.page,
        pageSize: input.pageSize
      };
    }),

  getById: protectedProcedure
    .input(z.string().min(1))
    .query(({ input }): Assessment => {
      const assessment = assessmentsData.find((a) => a.id === input);
      if (!assessment) {
        throw new TRPCError({ code: 'NOT_FOUND', message: '评估不存在' });
      }
      return assessment;
    }),

  create: protectedProcedure
    .use(nurseOrAbove)
    .input(
      z.object({
        elderId: z.string().min(1)
      })
    )
    .mutation(({ input, ctx }): Assessment => {
      const elder = mockElders.find((e) => e.id === input.elderId);
      if (!elder) {
        throw new TRPCError({ code: 'NOT_FOUND', message: '老人不存在' });
      }

      const now = new Date();
      const newAssessment: Assessment = {
        id: generateId(),
        elderId: input.elderId,
        status: 'draft',
        adlScore: 0,
        cognitionScore: 0,
        emotionScore: 0,
        socialScore: 0,
        totalScore: 0,
        suggestedLevelId: null,
        finalLevelId: null,
        currentStep: 0,
        createdAt: now,
        updatedAt: now,
        elder,
        suggestedLevel: null,
        finalLevel: null
      };
      assessmentsData.unshift(newAssessment);

      flowHandlers.push({
        id: generateId(),
        entityType: 'assessment',
        entityId: newAssessment.id,
        stepName: STEP_NAMES[0],
        userId: ctx.user?.id,
        userName: ctx.user?.name,
        handledAt: now,
        action: '创建'
      });

      return newAssessment;
    }),

  updateScores: protectedProcedure
    .use(nurseOrAbove)
    .input(
      z.object({
        id: z.string().min(1),
        adlScore: z.number().min(0).max(100).optional(),
        cognitionScore: z.number().min(0).max(100).optional(),
        emotionScore: z.number().min(0).max(100).optional(),
        socialScore: z.number().min(0).max(100).optional()
      })
    )
    .mutation(({ input }): Assessment => {
      const index = assessmentsData.findIndex((a) => a.id === input.id);
      if (index === -1) {
        throw new TRPCError({ code: 'NOT_FOUND', message: '评估不存在' });
      }

      const current = assessmentsData[index];
      const adlScore = input.adlScore ?? current.adlScore;
      const cognitionScore = input.cognitionScore ?? current.cognitionScore;
      const emotionScore = input.emotionScore ?? current.emotionScore;
      const socialScore = input.socialScore ?? current.socialScore;
      const totalScore = adlScore + cognitionScore + emotionScore + socialScore;
      const suggestedLevel = calculateSuggestedLevel(totalScore);

      assessmentsData[index] = {
        ...current,
        adlScore,
        cognitionScore,
        emotionScore,
        socialScore,
        totalScore,
        suggestedLevelId: suggestedLevel?.id ?? null,
        suggestedLevel,
        updatedAt: new Date()
      };
      return assessmentsData[index];
    }),

  advanceStep: protectedProcedure
    .use(nurseOrAbove)
    .input(
      z.object({
        id: z.string().min(1)
      })
    )
    .mutation(({ input, ctx }): Assessment => {
      const index = assessmentsData.findIndex((a) => a.id === input.id);
      if (index === -1) {
        throw new TRPCError({ code: 'NOT_FOUND', message: '评估不存在' });
      }

      const current = assessmentsData[index];
      if (current.currentStep >= STATUS_FLOW.length - 2) {
        throw new TRPCError({ code: 'BAD_REQUEST', message: '已到最终步骤' });
      }

      const nextStep = current.currentStep + 1;
      const nextStatus = STATUS_FLOW[nextStep];

      assessmentsData[index] = {
        ...current,
        currentStep: nextStep,
        status: nextStatus,
        updatedAt: new Date()
      };

      flowHandlers.push({
        id: generateId(),
        entityType: 'assessment',
        entityId: input.id,
        stepName: STEP_NAMES[nextStep],
        userId: ctx.user?.id,
        userName: ctx.user?.name,
        handledAt: new Date(),
        action: '推进'
      });

      return assessmentsData[index];
    }),

  setFinalLevel: protectedProcedure
    .use(supervisorOrAdmin)
    .input(
      z.object({
        id: z.string().min(1),
        careLevelId: z.string().min(1)
      })
    )
    .mutation(({ input }): Assessment => {
      const index = assessmentsData.findIndex((a) => a.id === input.id);
      if (index === -1) {
        throw new TRPCError({ code: 'NOT_FOUND', message: '评估不存在' });
      }

      const careLevel = mockCareLevels.find((cl) => cl.id === input.careLevelId);
      if (!careLevel) {
        throw new TRPCError({ code: 'NOT_FOUND', message: '护理等级不存在' });
      }

      assessmentsData[index] = {
        ...assessmentsData[index],
        finalLevelId: input.careLevelId,
        finalLevel: careLevel,
        updatedAt: new Date()
      };
      return assessmentsData[index];
    }),

  close: protectedProcedure
    .use(supervisorOrAdmin)
    .input(z.string().min(1))
    .mutation(({ input, ctx }): Assessment => {
      const index = assessmentsData.findIndex((a) => a.id === input.id);
      if (index === -1) {
        throw new TRPCError({ code: 'NOT_FOUND', message: '评估不存在' });
      }

      assessmentsData[index] = {
        ...assessmentsData[index],
        status: 'closed',
        currentStep: STATUS_FLOW.length - 1,
        updatedAt: new Date()
      };

      flowHandlers.push({
        id: generateId(),
        entityType: 'assessment',
        entityId: input.id,
        stepName: STEP_NAMES[STEP_NAMES.length - 1],
        userId: ctx.user?.id,
        userName: ctx.user?.name,
        handledAt: new Date(),
        action: '关闭'
      });

      return assessmentsData[index];
    }),

  listHandlers: protectedProcedure
    .input(z.string().min(1))
    .query(({ input }) => {
      return flowHandlers.filter(
        (h) => h.entityType === 'assessment' && h.entityId === input
      );
    })
});
