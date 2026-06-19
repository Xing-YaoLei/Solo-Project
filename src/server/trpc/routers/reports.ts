import { z } from 'zod';
import { router, protectedProcedure } from '../t';
import { and, eq, gte, lte, sql, desc, count, sum } from 'drizzle-orm';
import { property, order, cleaningTask, exceptionOrder, roomCalendar, deposit } from '$server/db/schema';
import { calculateOccupancyRate } from '$server/utils/conflict';
import { startOfDay, endOfDay, startOfMonth, endOfMonth, format, eachMonthOfInterval } from 'date-fns';
import type { DownloadMeta, OccupancyRateResult, RoomStatusType } from '$lib/types';
import { createAuditLog } from '$server/utils/audit';

export const reportsRouter = router({
	dashboardStats: protectedProcedure.query(async ({ ctx }) => {
		const today = startOfDay(new Date());
		const monthStart = startOfMonth(new Date());
		const monthEnd = endOfMonth(new Date());

		const [
			totalProperties,
			activeOrders,
			pendingCleanings,
			openExceptions,
			todayArrivals,
			todayDepartures,
			monthRevenue,
			monthOccupancy
		] = await Promise.all([
			await ctx.db.select({ count: count() }).from(property).where(eq(property.status, 'active')).get(),
			await ctx.db
				.select({ count: count() })
				.from(order)
				.where(sql`${order.status} IN ('pending','confirmed','checked_in')`)
				.get(),
			await ctx.db
				.select({ count: count() })
				.from(cleaningTask)
				.where(sql`${cleaningTask.status} IN ('pending','in_progress')`)
				.get(),
			await ctx.db
				.select({ count: count() })
				.from(exceptionOrder)
				.where(sql`${exceptionOrder.status} IN ('open','investigating')`)
				.get(),
			await ctx.db
				.select({ count: count() })
				.from(order)
				.where(
					and(
						gte(order.checkInDate, today),
						lte(order.checkInDate, new Date(today.getTime() + 86400000)),
						sql`${order.status} IN ('pending','confirmed')`
					)
				)
				.get(),
			await ctx.db
				.select({ count: count() })
				.from(order)
				.where(
					and(
						gte(order.checkOutDate, today),
						lte(order.checkOutDate, new Date(today.getTime() + 86400000)),
						sql`${order.status} IN ('confirmed','checked_in')`
					)
				)
				.get(),
			await ctx.db
				.select({ sum: sum(order.totalPrice) })
				.from(order)
				.where(
					and(
						gte(order.createdAt, monthStart),
						lte(order.createdAt, monthEnd),
						sql`${order.status} IN ('confirmed','checked_in','checked_out')`
					)
				)
				.get(),
			calculateOccupancyRate(ctx.db, monthStart, monthEnd)
		]);

		return {
			totalProperties: totalProperties?.count ?? 0,
			activeOrders: activeOrders?.count ?? 0,
			pendingCleanings: pendingCleanings?.count ?? 0,
			openExceptions: openExceptions?.count ?? 0,
			todayArrivals: todayArrivals?.count ?? 0,
			todayDepartures: todayDepartures?.count ?? 0,
			monthRevenue: monthRevenue?.sum ?? 0,
			monthOccupancyRate: monthOccupancy.occupancyRate,
			monthOccupancyDetails: {
				totalRoomNights: monthOccupancy.totalRoomNights,
				occupiedRoomNights: monthOccupancy.occupiedRoomNights,
				averageDailyRate: monthOccupancy.averageDailyRate
			}
		};
	}),

	occupancyRate: protectedProcedure
		.input(
			z.object({
				startDate: z.date(),
				endDate: z.date(),
				propertyIds: z.array(z.string()).optional()
			})
		)
		.query(async ({ ctx, input }) => {
			return calculateOccupancyRate(ctx.db, input.startDate, input.endDate, input.propertyIds);
		}),

	monthlyOccupancyTrend: protectedProcedure
		.input(
			z.object({
				months: z.number().int().default(6)
			}).optional()
		)
		.query(async ({ ctx, input }) => {
			const months = input?.months ?? 6;
			const today = new Date();
			const start = startOfMonth(new Date(today.getFullYear(), today.getMonth() - (months - 1), 1));
			const end = endOfMonth(today);
			const monthList = eachMonthOfInterval({ start, end });

			const results = [];
			for (const monthStart of monthList) {
				const monthEnd = endOfMonth(monthStart);
				const rate = await calculateOccupancyRate(ctx.db, monthStart, monthEnd);
				results.push({
					month: format(monthStart, 'yyyy-MM'),
					occupancyRate: rate.occupancyRate,
					revenue: rate.revenue,
					averageDailyRate: rate.averageDailyRate
				});
			}

			return results;
		}),

	channelRevenue: protectedProcedure
		.input(
			z.object({
				startDate: z.date(),
				endDate: z.date()
			})
		)
		.query(async ({ ctx, input }) => {
			const rows = await ctx.db
				.select({
					channel: order.channel,
					totalRevenue: sum(order.totalPrice),
					orderCount: count(),
					avgOrderValue: sql`AVG(${order.totalPrice})`
				})
				.from(order)
				.where(
					and(
						gte(order.createdAt, startOfDay(input.startDate)),
						lte(order.createdAt, endOfDay(input.endDate)),
						sql`${order.status} IN ('confirmed','checked_in','checked_out')`
					)
				)
				.groupBy(order.channel)
				.all();

			return rows.map((r) => ({
				channel: r.channel,
				totalRevenue: Number(r.totalRevenue) || 0,
				orderCount: r.orderCount,
				avgOrderValue: Number(r.avgOrderValue) || 0
			}));
		}),

	exportOccupancy: protectedProcedure
		.input(
			z.object({
				startDate: z.date(),
				endDate: z.date(),
				propertyIds: z.array(z.string()).optional(),
				format: z.enum(['json', 'csv']).default('json')
			})
		)
		.mutation(async ({ ctx, input }) => {
			const result = await calculateOccupancyRate(ctx.db, input.startDate, input.endDate, input.propertyIds);
			const generatedAt = new Date();

			const props = input.propertyIds && input.propertyIds.length > 0
				? await ctx.db.select().from(property).where(sql`${property.id} IN (${input.propertyIds.join(',')})`).all()
				: [];

			const meta: DownloadMeta = {
				generatedAt,
				generatedBy: ctx.user.username,
				dataRange: {
					startDate: input.startDate,
					endDate: input.endDate
				},
				metrics: [
					{
						name: '入住率 (Occupancy Rate)',
						definition: '统计周期内已入住夜数 / 总可售夜数 × 100%',
						calculation: `已入住夜数(${result.occupiedRoomNights}) / 总可售夜数(${result.totalRoomNights}) × 100% = ${result.occupancyRate.toFixed(2)}%`
					},
					{
						name: '平均日价 (ADR)',
						definition: '统计周期内客房收入 / 已售夜数',
						calculation: `客房收入(${result.revenue.toFixed(2)}) / 有效已售夜数 = ${result.averageDailyRate.toFixed(2)}`
					},
					{
						name: '总房态夜数',
						definition: '统计周期内所有活跃房源 × 天数，取数口径包含状态为active的房源',
						calculation: `活跃房源数 × ${format(input.startDate, 'yyyy-MM-dd')} 至 ${format(input.endDate, 'yyyy-MM-dd')} 日期间天数`
					}
				],
				filters: {
					propertyIds: input.propertyIds ?? '全部房源',
					propertyNames: props.length > 0 ? props.map((p) => p.name) : '全部',
					dateRange: `${format(input.startDate, 'yyyy-MM-dd')} ~ ${format(input.endDate, 'yyyy-MM-dd')}`
				},
				notes: [
					'1. 取数仅包含状态为active的房源；若存在临时关闭房源，实际可售夜数可能少于显示总夜数。',
					'2. 入住率计算口径：已预订(booked)、在住(occupied)、已入住(checked_in)三种状态计入已入住夜数。',
					'3. 平均日价计算口径：基于有实际价格记录的日历条目均价，未包含未录入价格的免费/赠送夜。',
					'4. 若存在房态冲突异常单未关闭，对应日期可能被重复计入，需结合异常单列表复核。'
				].join('\n')
			};

			await createAuditLog(
				{
					action: 'export',
					entityType: 'occupancy_report',
					entityId: `occ_${format(generatedAt, 'yyyyMMddHHmmss')}`,
					meta: { ...input, format: input.format }
				},
				ctx.user.id,
				ctx.db
			);

			if (input.format === 'csv') {
				const detailsCsv = result.details.map((d) =>
					`${format(d.date, 'yyyy-MM-dd')},${d.propertyId},"${d.propertyName}",${d.status},${d.price ?? ''}`
				).join('\n');

				const metaCsv = [
					`# 取数口径说明`,
					`生成时间,${format(meta.generatedAt, 'yyyy-MM-dd HH:mm:ss')}`,
					`生成人,${meta.generatedBy}`,
					`统计周期,${meta.dataRange.startDate.toISOString().split('T')[0]} ~ ${meta.dataRange.endDate.toISOString().split('T')[0]}`,
					`筛选条件,${JSON.stringify(meta.filters)}`,
					``,
					`# 指标口径`,
					...meta.metrics.map((m) => `"${m.name}","${m.definition}","${m.calculation}"`),
					``,
					`# 汇总结果`,
					`总可售夜数,${result.totalRoomNights}`,
					`已入住夜数,${result.occupiedRoomNights}`,
					`入住率,${result.occupancyRate.toFixed(2)}%`,
					`平均日价(ADR),${result.averageDailyRate.toFixed(2)}`,
					`客房收入(Revenue),${result.revenue.toFixed(2)}`,
					``,
					`# 备注`,
					meta.notes.split('\n').map((n) => `"${n}"`).join('\n'),
					``,
					`# 明细数据`,
					`日期,房源ID,房源名称,房态,价格`
				].join('\n');

				return {
					format: 'csv',
					meta,
					summary: {
						period: result.period,
						totalRoomNights: result.totalRoomNights,
						occupiedRoomNights: result.occupiedRoomNights,
						occupancyRate: result.occupancyRate,
						averageDailyRate: result.averageDailyRate,
						revenue: result.revenue
					},
					content: metaCsv + '\n' + detailsCsv,
					filename: `入住率报表_${format(meta.generatedAt, 'yyyyMMdd')}.csv`
				};
			}

			return {
				format: 'json',
				meta,
				summary: {
					period: result.period,
					totalRoomNights: result.totalRoomNights,
					occupiedRoomNights: result.occupiedRoomNights,
					occupancyRate: result.occupancyRate,
					averageDailyRate: result.averageDailyRate,
					revenue: result.revenue
				},
				details: result.details,
				filename: `入住率报表_${format(meta.generatedAt, 'yyyyMMdd')}.json`
			};
		})
});
