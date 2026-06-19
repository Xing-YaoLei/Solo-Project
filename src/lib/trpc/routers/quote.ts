import { z } from 'zod';
import { createTRPCRouter, protectedProcedure } from '../server';
import * as quoteService from '$lib/server/services/quoteService';

export const quoteRouter = createTRPCRouter({
	list: protectedProcedure
		.input(quoteService.ListQuoteSchema)
		.query(async ({ ctx, input }) => {
			return await quoteService.listQuotes(input, ctx.user);
		}),

	get: protectedProcedure
		.input(z.string().uuid())
		.query(async ({ ctx, input }) => {
			return await quoteService.getQuote(input, ctx.user);
		}),

	create: protectedProcedure
		.input(quoteService.CreateQuoteSchema)
		.mutation(async ({ ctx, input }) => {
			return await quoteService.createQuote(input, ctx.user);
		}),

	updateStatus: protectedProcedure
		.input(quoteService.UpdateQuoteStatusSchema)
		.mutation(async ({ ctx, input }) => {
			return await quoteService.updateQuoteStatus(input, ctx.user);
		})
});
