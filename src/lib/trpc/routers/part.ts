import { z } from 'zod';
import { createTRPCRouter, protectedProcedure } from '../server';
import * as partService from '$lib/server/services/partService';

export const partRouter = createTRPCRouter({
	list: protectedProcedure
		.input(partService.ListPartSchema)
		.query(async ({ input }) => {
			return await partService.listParts(input);
		}),

	lowStock: protectedProcedure.query(async () => {
		return await partService.getLowStockParts();
	}),

	create: protectedProcedure
		.input(partService.CreatePartSchema)
		.mutation(async ({ ctx, input }) => {
			return await partService.createPart(input, ctx.user);
		}),

	update: protectedProcedure
		.input(partService.UpdatePartSchema)
		.mutation(async ({ ctx, input }) => {
			return await partService.updatePart(input, ctx.user);
		}),

	movement: protectedProcedure
		.input(partService.MovementSchema)
		.mutation(async ({ ctx, input }) => {
			return await partService.createMovement(input, ctx.user);
		}),

	batchOut: protectedProcedure
		.input(partService.BatchOutSchema)
		.mutation(async ({ ctx, input }) => {
			await partService.batchOut(input, ctx.user);
		}),

	movements: protectedProcedure
		.input(z.string().uuid())
		.query(async ({ input }) => {
			return await partService.getPartMovements(input);
		})
});
