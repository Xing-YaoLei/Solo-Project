import { z } from 'zod';
import { createTRPCRouter, protectedProcedure } from '../server';
import * as attachmentService from '$lib/server/services/attachmentService';

export const attachmentRouter = createTRPCRouter({
	listByRef: protectedProcedure
		.input(attachmentService.ListByRefSchema)
		.query(async ({ ctx, input }) => {
			return await attachmentService.listByRef(input, ctx.user);
		}),

	delete: protectedProcedure
		.input(z.string().uuid())
		.mutation(async ({ ctx, input }) => {
			await attachmentService.deleteAttachment(input, ctx.user);
		})
});
