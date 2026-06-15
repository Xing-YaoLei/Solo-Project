import { z } from 'zod';
import { router, protectedProcedure, requirePermission } from '../trpc';
import { learningProgress, examScores, users, courses, userRoles, roles } from '../../db/schema';
import { eq, and, gte, lte, desc, sql } from 'drizzle-orm';

export const reportsRouter = router({
	completionRateByCourse: requirePermission('report.view')
		.input(
			z.object({
				startDate: z.string().optional(),
				endDate: z.string().optional(),
				category: z.string().optional()
			})
		)
		.query(async ({ ctx, input }) => {
			const whereConditions = [];

			if (input.startDate) {
				whereConditions.push(gte(learningProgress.createdAt, new Date(input.startDate)));
			}
			if (input.endDate) {
				whereConditions.push(lte(learningProgress.createdAt, new Date(input.endDate)));
			}

			const completedCountExpr = sql<number>`sum(case when ${learningProgress.isCompleted} then 1 else 0 end)`.mapWith(
				Number
			);

			const progressData = await ctx.db
				.select({
					courseId: learningProgress.courseId,
					courseTitle: courses.title,
					totalCount: sql<number>`count(*)`.mapWith(Number),
					completedCount: completedCountExpr,
					avgProgress: sql<number>`avg(${learningProgress.progressPercent})`.mapWith(Number)
				})
				.from(learningProgress)
				.innerJoin(courses, eq(learningProgress.courseId, courses.id))
				.where(whereConditions.length > 0 ? and(...whereConditions) : undefined)
				.groupBy(learningProgress.courseId, courses.title)
				.orderBy(desc(completedCountExpr));

			return progressData.map((item) => ({
				...item,
				completionRate: item.totalCount > 0 ? (item.completedCount / item.totalCount) * 100 : 0
			}));
		}),

	examPassRateByDate: requirePermission('report.view')
		.input(
			z.object({
				startDate: z.string(),
				endDate: z.string(),
				courseId: z.string().optional(),
				granularity: z.enum(['day', 'week', 'month']).default('day')
			})
		)
		.query(async ({ ctx, input }) => {
			const whereConditions = [
				gte(examScores.createdAt, new Date(input.startDate)),
				lte(examScores.createdAt, new Date(input.endDate))
			];

			if (input.courseId) {
				whereConditions.push(eq(examScores.courseId, input.courseId));
			}

			let dateExpr: any;
			if (input.granularity === 'day') {
				dateExpr = sql<Date>`date_trunc('day', ${examScores.createdAt})`.as('date');
			} else if (input.granularity === 'week') {
				dateExpr = sql<Date>`date_trunc('week', ${examScores.createdAt})`.as('date');
			} else {
				dateExpr = sql<Date>`date_trunc('month', ${examScores.createdAt})`.as('date');
			}

			const data = await ctx.db
				.select({
					date: dateExpr,
					totalCount: sql<number>`count(*)`.mapWith(Number),
					passedCount: sql<number>`sum(case when ${examScores.isPassed} then 1 else 0 end)`.mapWith(Number),
					avgScore: sql<number>`avg(${examScores.score})`.mapWith(Number)
				})
				.from(examScores)
				.where(and(...whereConditions))
				.groupBy(sql`date`)
				.orderBy(sql`date`);

			return data.map((item: any) => ({
				...item,
				passRate: item.totalCount > 0 ? (item.passedCount / item.totalCount) * 100 : 0
			}));
		}),

	performanceByUser: requirePermission('report.view')
		.input(
			z.object({
				page: z.number().default(1),
				pageSize: z.number().default(20),
				role: z.string().optional(),
				courseId: z.string().optional(),
				keyword: z.string().optional()
			})
		)
		.query(async ({ ctx, input }) => {
			const userWhereConditions = [];

			if (input.keyword) {
				userWhereConditions.push(
					sql`(${users.name} ilike ${`%${input.keyword}%`} or ${users.email} ilike ${`%${input.keyword}%`})`
				);
			}

			if (input.role) {
				userWhereConditions.push(eq(roles.code, input.role));
			}

			const usersQuery = ctx.db
				.select({
					id: users.id,
					name: users.name,
					email: users.email,
					avatar: users.avatar,
					roleCode: roles.code,
					roleName: roles.name
				})
				.from(users)
				.innerJoin(userRoles, eq(userRoles.userId, users.id))
				.innerJoin(roles, eq(roles.id, userRoles.roleId))
				.where(userWhereConditions.length > 0 ? and(...userWhereConditions) : undefined);

			const usersList = await usersQuery.limit(input.pageSize).offset((input.page - 1) * input.pageSize);

			const userIds = usersList.map((u) => u.id);

			const [progressStats, examStats] = await Promise.all([
				ctx.db
					.select({
						userId: learningProgress.userId,
						totalCourses: sql<number>`count(*)`.mapWith(Number),
						completedCourses: sql<number>`sum(case when ${learningProgress.isCompleted} then 1 else 0 end)`.mapWith(
							Number
						),
						avgProgress: sql<number>`avg(${learningProgress.progressPercent})`.mapWith(Number)
					})
					.from(learningProgress)
					.where(inArrayOrDefault(learningProgress.userId, userIds))
					.groupBy(learningProgress.userId),
				ctx.db
					.select({
						userId: examScores.userId,
						totalExams: sql<number>`count(*)`.mapWith(Number),
						passedExams: sql<number>`sum(case when ${examScores.isPassed} then 1 else 0 end)`.mapWith(Number),
						avgScore: sql<number>`avg(${examScores.score})`.mapWith(Number)
					})
					.from(examScores)
					.where(inArrayOrDefault(examScores.userId, userIds))
					.groupBy(examScores.userId)
			]);

			const progressMap = new Map(progressStats.map((s) => [s.userId, s]));
			const examMap = new Map(examStats.map((s) => [s.userId, s]));

			const result = usersList.map((user) => {
				const p = progressMap.get(user.id);
				const e = examMap.get(user.id);
				return {
					...user,
					totalCourses: p?.totalCourses || 0,
					completedCourses: p?.completedCourses || 0,
					avgProgress: p?.avgProgress || 0,
					totalExams: e?.totalExams || 0,
					passedExams: e?.passedExams || 0,
					avgScore: e?.avgScore || 0,
					passRate: e && e.totalExams > 0 ? (e.passedExams / e.totalExams) * 100 : 0
				};
			});

			return {
				items: result,
				total: usersList.length,
				page: input.page,
				pageSize: input.pageSize
			};
		}),

	overviewStats: requirePermission('report.view').query(async ({ ctx }) => {
		const [totalUsers, totalCourses, totalExams, avgPassRate] = await Promise.all([
			ctx.db.select({ count: sql<number>`count(*)`.mapWith(Number) }).from(users).then((r) => r[0].count),
			ctx.db.select({ count: sql<number>`count(*)`.mapWith(Number) }).from(courses).then((r) => r[0].count),
			ctx.db.select({ count: sql<number>`count(*)`.mapWith(Number) }).from(examScores).then((r) => r[0].count),
			ctx.db
				.select({
					rate: sql<number>`(sum(case when ${examScores.isPassed} then 1 else 0 end)::float / count(*)) * 100`.mapWith(
						Number
					)
				})
				.from(examScores)
				.then((r) => r[0]?.rate || 0)
		]);

		return {
			totalUsers,
			totalCourses,
			totalExams,
			avgPassRate
		};
	})
});

function inArrayOrDefault(column: any, values: string[]) {
	if (values.length === 0) {
		return sql`1=0`;
	}
	return sql`${column} = any(${values})`;
}
