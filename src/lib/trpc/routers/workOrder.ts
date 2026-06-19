import { z } from 'zod';
import { createTRPCRouter, protectedProcedure } from '../server';
import * as workOrderService from '$lib/server/services/workOrderService';

export const workOrderRouter = createTRPCRouter({
	list: protectedProcedure
		.input(workOrderService.WorkOrderFilterSchema)
		.query(async ({ ctx, input }) => {
			return await workOrderService.listWorkOrders(input, ctx.user);
		}),

	get: protectedProcedure
		.input(z.string().uuid())
		.query(async ({ ctx, input }) => {
			return await workOrderService.getWorkOrder(input, ctx.user);
		}),

	create: protectedProcedure
		.input(workOrderService.CreateWorkOrderSchema)
		.mutation(async ({ ctx, input }) => {
			return await workOrderService.createWorkOrder(input, ctx.user);
		}),

	update: protectedProcedure
		.input(workOrderService.UpdateWorkOrderSchema)
		.mutation(async ({ ctx, input }) => {
			return await workOrderService.updateWorkOrder(input, ctx.user);
		}),

	batchAssign: protectedProcedure
		.input(workOrderService.BatchAssignSchema)
		.mutation(async ({ ctx, input }) => {
			await workOrderService.batchAssign(input, ctx.user);
		}),

	batchUpdateStatus: protectedProcedure
		.input(workOrderService.BatchUpdateStatusSchema)
		.mutation(async ({ ctx, input }) => {
			await workOrderService.batchUpdateStatus(input, ctx.user);
		}),

	addItem: protectedProcedure
		.input(workOrderService.AddWorkOrderItemSchema)
		.mutation(async ({ ctx, input }) => {
			await workOrderService.addWorkOrderItem(input, ctx.user);
		}),

	updateItemStatus: protectedProcedure
		.input(workOrderService.UpdateItemStatusSchema)
		.mutation(async ({ ctx, input }) => {
			return await workOrderService.updateItemStatus(input, ctx.user);
		})
});
