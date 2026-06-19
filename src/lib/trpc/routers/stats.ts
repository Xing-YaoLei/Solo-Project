import { createTRPCRouter, protectedProcedure } from '../server';
import * as statsService from '$lib/server/services/statsService';

export const statsRouter = createTRPCRouter({
	overview: protectedProcedure.query(async ({ ctx }) => {
		return await statsService.getOverview(ctx.user);
	}),

	reworkRate: protectedProcedure
		.input(statsService.ReworkRateSchema)
		.query(async ({ ctx, input }) => {
			return await statsService.getReworkRate(input, ctx.user);
		}),

	business: protectedProcedure
		.input(statsService.BusinessSchema)
		.query(async ({ ctx, input }) => {
			return await statsService.getBusinessData(input, ctx.user);
		}),

	partsRanking: protectedProcedure
		.input(statsService.PartsRankingSchema)
		.query(async ({ input }) => {
			return await statsService.getPartsRanking(input);
		}),

	todoList: protectedProcedure.query(async ({ ctx }) => {
		return await statsService.getTodoList(ctx.user);
	}),

	maintenanceReminders: protectedProcedure
		.input(statsService.MaintenanceRemindersSchema)
		.query(async ({ input }) => {
			return await statsService.getMaintenanceReminders(input);
		})
});
