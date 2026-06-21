import { z } from 'zod';
import { router, protectedProcedure } from '../trpc';
import { db } from '$lib/server/db';
import {
	notes,
	attachments,
	flowRecords,
	users,
	projects,
	documentTypeEnum,
	statusEnum,
	roleEnum
} from '$lib/server/db/schema';
import { eq, desc, and, type SQL, isNotNull, sql } from 'drizzle-orm';
import { TRPCError } from '@trpc/server';

export const commonRouter = router({
	upload: protectedProcedure
		.input(
			z.object({
				fileName: z.string().min(1),
				fileType: z.string().optional(),
				fileSize: z.number().optional()
			})
		)
		.mutation(async ({ input }) => {
			const randomId = crypto.randomUUID();
			const ext = input.fileName.split('.').pop() || '';
			const mockUrl = `/uploads/${randomId}.${ext}`;

			return {
				url: mockUrl,
				fileName: input.fileName,
				fileType: input.fileType,
				fileSize: input.fileSize
			};
		}),

	addNote: protectedProcedure
		.input(
			z.object({
				documentId: z.string().uuid(),
				documentType: z.enum(['change_order', 'acceptance_photo', 'worker_checkin', 'after_sales_order']),
				content: z.string().min(1)
			})
		)
		.mutation(async ({ input, ctx }) => {
			const [note] = await db
				.insert(notes)
				.values({
					documentId: input.documentId,
					documentType: input.documentType,
					content: input.content,
					createdById: ctx.user.id
				})
				.returning();

			return note;
		}),

	getNotes: protectedProcedure
		.input(
			z.object({
				documentId: z.string().uuid(),
				documentType: z.enum(['change_order', 'acceptance_photo', 'worker_checkin', 'after_sales_order'])
			})
		)
		.query(async ({ input }) => {
			const data = await db
				.select()
				.from(notes)
				.where(
					and(
						eq(notes.documentId, input.documentId),
						eq(notes.documentType, input.documentType)
					)
				)
				.orderBy(desc(notes.createdAt));

			return data;
		}),

	addAttachment: protectedProcedure
		.input(
			z.object({
				documentId: z.string().uuid(),
				documentType: z.enum(['change_order', 'acceptance_photo', 'worker_checkin', 'after_sales_order']),
				name: z.string().min(1).max(255),
				url: z.string().min(1),
				size: z.number().optional(),
				mimeType: z.string().max(100).optional()
			})
		)
		.mutation(async ({ input, ctx }) => {
			const [attachment] = await db
				.insert(attachments)
				.values({
					...input,
					uploadedById: ctx.user.id
				})
				.returning();

			return attachment;
		}),

	getAttachments: protectedProcedure
		.input(
			z.object({
				documentId: z.string().uuid(),
				documentType: z.enum(['change_order', 'acceptance_photo', 'worker_checkin', 'after_sales_order'])
			})
		)
		.query(async ({ input }) => {
			const data = await db
				.select()
				.from(attachments)
				.where(
					and(
						eq(attachments.documentId, input.documentId),
						eq(attachments.documentType, input.documentType)
					)
				)
				.orderBy(desc(attachments.createdAt));

			return data;
		}),

	getFlowRecords: protectedProcedure
		.input(
			z.object({
				documentId: z.string().uuid(),
				documentType: z.enum(['change_order', 'acceptance_photo', 'worker_checkin', 'after_sales_order'])
			})
		)
		.query(async ({ input }) => {
			const data = await db
				.select()
				.from(flowRecords)
				.where(
					and(
						eq(flowRecords.documentId, input.documentId),
						eq(flowRecords.documentType, input.documentType)
					)
				)
				.orderBy(desc(flowRecords.createdAt));

			return data;
		}),

	getUsers: protectedProcedure
		.input(
			z.object({
				role: z.enum(['project_manager', 'designer', 'foreman', 'worker', 'supplier', 'client', 'admin']).optional()
			})
		)
		.query(async ({ input }) => {
			const where: SQL<unknown>[] = [];
			if (input.role) {
				where.push(eq(users.role, input.role));
			}

			const data = await db
				.select({
					id: users.id,
					username: users.username,
					fullName: users.fullName,
					email: users.email,
					phone: users.phone,
					role: users.role,
					avatar: users.avatar,
					createdAt: users.createdAt
				})
				.from(users)
				.where(where.length > 0 ? and(...where) : undefined)
				.orderBy(desc(users.createdAt));

			return data;
		}),

	exportData: protectedProcedure
		.input(
			z.object({
				type: z.enum(['change_order', 'acceptance_photo', 'worker_checkin', 'after_sales_order']),
				filters: z.record(z.string(), z.string()).optional()
			})
		)
		.query(async ({ input }) => {
			let csvContent = '';
			let headers: string[] = [];
			let rows: string[][] = [];

			switch (input.type) {
				case 'change_order':
					headers = ['ID', '项目ID', '编号', '标题', '描述', '状态', '创建时间'];
					rows = [
						['1', 'proj-1', 'CO-001', '设计变更', '变更描述', 'approved', '2024-01-01'],
						['2', 'proj-2', 'CO-002', '材料变更', '变更描述', 'processing', '2024-01-02']
					];
					break;
				case 'acceptance_photo':
					headers = ['ID', '项目ID', '编号', '标题', '阶段', '状态', '验收时间'];
					rows = [
						['1', 'proj-1', 'AP-001', '水电验收', '水电阶段', 'completed', '2024-01-01'],
						['2', 'proj-1', 'AP-002', '泥木验收', '泥木阶段', 'pending', '2024-01-02']
					];
					break;
				case 'worker_checkin':
					headers = ['ID', '项目ID', '工人ID', '签到时间', '签退时间', '工作内容', '工时'];
					rows = [
						['1', 'proj-1', 'user-1', '2024-01-01 08:00', '2024-01-01 17:00', '砌墙', '8'],
						['2', 'proj-1', 'user-2', '2024-01-01 08:00', '2024-01-01 17:00', '水电', '8']
					];
					break;
				case 'after_sales_order':
					headers = ['ID', '项目ID', '编号', '标题', '类型', '优先级', '状态'];
					rows = [
						['1', 'proj-1', 'AS-001', '墙面开裂', '质量问题', 'high', 'processing'],
						['2', 'proj-2', 'AS-002', '水电维修', '维修', 'normal', 'pending']
					];
					break;
			}

			csvContent = headers.join(',') + '\n';
			csvContent += rows.map((row) => row.join(',')).join('\n');

			return {
				csvContent,
				fileName: `${input.type}_export_${Date.now()}.csv`
			};
		}),

	getScheduleAnalysis: protectedProcedure
		.input(z.object({}).optional())
		.query(async () => {
			const data = await db
				.select({
					id: projects.id,
					name: projects.name,
					startDate: projects.startDate,
					expectedEndDate: projects.expectedEndDate,
					actualEndDate: projects.actualEndDate
				})
				.from(projects)
				.where(isNotNull(projects.startDate));

			const analysis = data.map((project) => {
				const startDate = project.startDate;
				const expectedEndDate = project.expectedEndDate;
				const actualEndDate = project.actualEndDate;

				let plannedDuration = 0;
				let actualDuration = 0;
				let deviationDays = 0;

				if (startDate && expectedEndDate) {
					plannedDuration = Math.ceil(
						(expectedEndDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)
					);
				}

				if (startDate && actualEndDate) {
					actualDuration = Math.ceil(
						(actualEndDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)
					);
					deviationDays = actualDuration - plannedDuration;
				}

				return {
					projectId: project.id,
					projectName: project.name,
					plannedDuration,
					actualDuration,
					deviationDays,
					status: deviationDays > 0 ? 'delayed' : deviationDays < 0 ? 'ahead' : 'on_schedule'
				};
			});

			return analysis;
		})
});
