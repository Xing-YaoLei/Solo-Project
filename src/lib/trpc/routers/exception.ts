import { z } from 'zod';
import { createTRPCRouter, protectedProcedure } from '../server';
import * as exceptionService from '$lib/server/services/exceptionService';

export const exceptionRouter = createTRPCRouter({
	list: protectedProcedure
		.input(exceptionService.ListExceptionSchema)
		.query(async ({ ctx, input }) => {
			return await exceptionService.listExceptions(input, ctx.user);
		}),

	get: protectedProcedure
		.input(z.string().uuid())
		.query(async ({ ctx, input }) => {
			return await exceptionService.getException(input, ctx.user);
		}),

	create: protectedProcedure
		.input(exceptionService.CreateExceptionSchema)
		.mutation(async ({ ctx, input }) => {
			return await exceptionService.createException(input, ctx.user);
		}),

	addProcessLog: protectedProcedure
		.input(exceptionService.AddProcessLogSchema)
		.mutation(async ({ ctx, input }) => {
			return await exceptionService.addProcessLog(input, ctx.user);
		}),

	submitForReview: protectedProcedure
		.input(z.string().uuid())
		.mutation(async ({ ctx, input }) => {
			return await exceptionService.submitForReview(input, ctx.user);
		}),

	review: protectedProcedure
		.input(exceptionService.ReviewSchema)
		.mutation(async ({ ctx, input }) => {
			return await exceptionService.reviewException(input, ctx.user);
		})
});
