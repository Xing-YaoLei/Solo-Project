import { z } from 'zod';
import { eq, and, desc, asc, isNull, count, sql } from 'drizzle-orm';
import { router, workerProcedure, managerProcedure } from '../trpc';
import {
	projectTable,
	authorizationScopeTable,
	customerProfileTable,
	changeRecordTable,
	attachmentTable,
	documentCategoryTable,
	reviewOpinionTable,
	communicationNoteTable,
	documentCompletenessLogTable,
	userTable
} from '$server/db/schema';

export const projectRouter = router({
	list: workerProcedure
		.input(
			z.object({
				page: z.number().default(1),
				pageSize: z.number().default(20),
				status: z.string().optional(),
				keyword: z.string().optional()
			})
		)
		.query(async ({ ctx, input }) => {
			const whereConditions = [];
			if (input.status) {
				whereConditions.push(eq(projectTable.status, input.status));
			}
			if (input.keyword) {
				whereConditions.push(
					sql`(${projectTable.name} ILIKE ${'%' + input.keyword + '%'} OR ${projectTable.customerName} ILIKE ${'%' + input.keyword + '%'} OR ${projectTable.projectNo} ILIKE ${'%' + input.keyword + '%'})`
				);
			}

			const offset = (input.page - 1) * input.pageSize;

			const projects = await ctx.db
				.select({
					project: projectTable,
					manager: userTable
				})
				.from(projectTable)
				.leftJoin(userTable, eq(projectTable.projectManager, userTable.id))
				.where(whereConditions.length ? and(...whereConditions) : undefined)
				.orderBy(desc(projectTable.updatedAt))
				.limit(input.pageSize)
				.offset(offset);

			const totalResult = await ctx.db
				.select({ count: count() })
				.from(projectTable)
				.where(whereConditions.length ? and(...whereConditions) : undefined);

			return {
				projects: projects.map((p) => ({
					...p.project,
					managerName: p.manager?.fullName
				})),
				total: totalResult[0].count
			};
		}),

	get: workerProcedure
		.input(z.object({ id: z.string().uuid() }))
		.query(async ({ ctx, input }) => {
			const project = await ctx.db.query.projectTable.findFirst({
				where: eq(projectTable.id, input.id),
				with: {
					manager: true,
					customerProfile: true,
					authorizations: {
						with: {
							authorizedByUser: {
								columns: {
									id: true,
									fullName: true
								}
							}
						},
						orderBy: desc(authorizationScopeTable.createdAt)
					},
					changeRecords: {
						with: {
							creator: {
								columns: {
									id: true,
									fullName: true
								}
							},
							reviewer: {
								columns: {
									id: true,
									fullName: true
								}
							},
							attachments: true
						},
						orderBy: desc(changeRecordTable.createdAt)
					},
					attachments: {
						with: {
							category: true,
							uploader: {
								columns: {
									id: true,
									fullName: true
								}
							}
						},
						where: eq(attachmentTable.isValid, true),
						orderBy: desc(attachmentTable.createdAt)
					},
					reviewOpinions: {
						with: {
							reviewer: {
								columns: {
									id: true,
									fullName: true,
									role: true
								}
							},
							communicationNotes: {
								with: {
									communicator: {
										columns: {
											id: true,
											fullName: true
										}
									}
								},
								orderBy: asc(communicationNoteTable.createdAt)
							}
						},
						orderBy: desc(reviewOpinionTable.createdAt)
					},
					completenessLogs: {
						orderBy: desc(documentCompletenessLogTable.calculatedAt),
						limit: 30
					}
				}
			});

			if (!project) {
				throw new Error('项目不存在');
			}

			return project;
		}),

	create: managerProcedure
		.input(
			z.object({
				projectNo: z.string().min(2).max(50),
				name: z.string().min(2).max(200),
				address: z.string().max(500).optional(),
				customerName: z.string().min(2).max(128),
				customerPhone: z.string().min(7).max(20),
				projectManager: z.string().uuid().optional(),
				startDate: z.string().optional(),
				expectedEndDate: z.string().optional()
			})
		)
		.mutation(async ({ ctx, input }) => {
			const [project] = await ctx.db
				.insert(projectTable)
				.values({
					...input,
					startDate: input.startDate ? new Date(input.startDate) : null,
					expectedEndDate: input.expectedEndDate ? new Date(input.expectedEndDate) : null
				})
				.returning();
			return project;
		}),

	update: managerProcedure
		.input(
			z.object({
				id: z.string().uuid(),
				name: z.string().min(2).max(200).optional(),
				address: z.string().max(500).optional(),
				customerName: z.string().min(2).max(128).optional(),
				customerPhone: z.string().min(7).max(20).optional(),
				projectManager: z.string().uuid().optional().nullable(),
				status: z.string().optional(),
				startDate: z.string().optional().nullable(),
				expectedEndDate: z.string().optional().nullable()
			})
		)
		.mutation(async ({ ctx, input }) => {
			const updateData: any = { ...input };
			if (updateData.startDate !== undefined) {
				updateData.startDate = updateData.startDate ? new Date(updateData.startDate) : null;
			}
			if (updateData.expectedEndDate !== undefined) {
				updateData.expectedEndDate = updateData.expectedEndDate
					? new Date(updateData.expectedEndDate)
					: null;
			}
			delete updateData.id;

			const [project] = await ctx.db
				.update(projectTable)
				.set({
					...updateData,
					updatedAt: new Date()
				})
				.where(eq(projectTable.id, input.id))
				.returning();

			return project;
		}),

	getDocumentCategories: workerProcedure.query(async ({ ctx }) => {
		return await ctx.db
			.select()
			.from(documentCategoryTable)
			.orderBy(asc(documentCategoryTable.sortOrder), asc(documentCategoryTable.name));
	}),

	calculateCompleteness: workerProcedure
		.input(z.object({ projectId: z.string().uuid() }))
		.mutation(async ({ ctx, input }) => {
			const categories = await ctx.db
				.select()
				.from(documentCategoryTable)
				.where(eq(documentCategoryTable.required, true));

			const totalRequired = categories.length;
			let completedCount = 0;
			const missingCategories: any[] = [];

			for (const category of categories) {
				const attachment = await ctx.db.query.attachmentTable.findFirst({
					where: and(
						eq(attachmentTable.projectId, input.projectId),
						eq(attachmentTable.categoryId, category.id),
						eq(attachmentTable.isValid, true)
					)
				});

				if (attachment) {
					completedCount++;
				} else {
					missingCategories.push({
						id: category.id,
						code: category.code,
						name: category.name,
						description: category.description
					});
				}
			}

			const completenessRate = totalRequired > 0 ? Math.round((completedCount / totalRequired) * 100) : 0;

			await ctx.db.insert(documentCompletenessLogTable).values({
				projectId: input.projectId,
				completenessRate,
				totalRequired,
				completedCount,
				missingCategories
			});

			return {
				completenessRate,
				totalRequired,
				completedCount,
				missingCategories
			};
		})
});
