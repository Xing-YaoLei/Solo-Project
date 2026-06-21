import { z } from 'zod';
import { router, protectedProcedure, operatorProcedure, financeProcedure } from '../trpc/trpc';
import { and, eq, sql, gte, lte, alias } from 'drizzle-orm';
import {
	sponsors,
	sponsorTickets,
	verifications,
	ticketTypes,
	orders,
	orderItems,
	disputeTickets,
	events,
	users
} from '../db/schema';
import type { ExportCaliber } from '$lib/shared/types';
import { randomUUID } from 'crypto';

type ExportModule =
	| 'sponsors'
	| 'sponsor-tickets'
	| 'verifications'
	| 'ticket-types'
	| 'orders'
	| 'order-items'
	| 'disputes'
	| 'verification-stats';

export const exportRouter = router({
	exportData: protectedProcedure
		.input(
			z.object({
				module: z.enum([
					'sponsors',
					'sponsor-tickets',
					'verifications',
					'ticket-types',
					'orders',
					'order-items',
					'disputes',
					'verification-stats'
				]),
				eventId: z.string().optional(),
				dateRange: z.object({ startDate: z.string().optional(), endDate: z.string().optional() }).optional(),
				filters: z.record(z.any()).optional(),
				format: z.enum(['csv', 'json']).default('csv')
			})
		)
		.mutation(async ({ ctx, input }) => {
			const { module, eventId, dateRange, filters, format } = input;

			const dateFilters: any = {};
			if (dateRange?.startDate) dateFilters.startDate = dateRange.startDate;
			if (dateRange?.endDate) dateFilters.endDate = dateRange.endDate;

			const caliber: ExportCaliber = {
				scope: module,
				timeRange: dateRange ? { startDate: dateRange.startDate, endDate: dateRange.endDate } : undefined,
				filters: { eventId, ...(filters ?? {}) },
				aggregationRules: getAggregationRules(module),
				calculatedAt: new Date().toISOString(),
				operator: `${ctx.user?.displayName ?? ctx.user?.username ?? 'Unknown'} (ID: ${ctx.user?.id ?? 'N/A'})`
			};

			let data: any[] = [];
			let dataRowCount = 0;

			switch (module) {
				case 'sponsors':
					data = await exportSponsors(ctx, eventId, dateRange, filters);
					dataRowCount = data.length;
					break;
				case 'sponsor-tickets':
					data = await exportSponsorTickets(ctx, eventId, dateRange, filters);
					dataRowCount = data.length;
					break;
				case 'verifications':
					data = await exportVerifications(ctx, eventId, dateRange, filters);
					dataRowCount = data.length;
					break;
				case 'ticket-types':
					data = await exportTicketTypes(ctx, eventId);
					dataRowCount = data.length;
					break;
				case 'orders':
					data = await exportOrders(ctx, eventId, dateRange, filters);
					dataRowCount = data.length;
					break;
				case 'order-items':
					data = await exportOrderItems(ctx, eventId, dateRange, filters);
					dataRowCount = data.length;
					break;
				case 'disputes':
					data = await exportDisputes(ctx, eventId, dateRange, filters);
					dataRowCount = data.length;
					break;
				case 'verification-stats':
					data = await exportVerificationStats(ctx, eventId, dateRange);
					dataRowCount = data.length;
					break;
			}

			const fileName = `${module}_${new Date().toISOString().slice(0, 10)}_${randomUUID().slice(0, 8)}`;

			let content: string;
			let mimeType: string;
			let extension: string;

			if (format === 'json') {
				content = JSON.stringify(
					{
						caliber,
						summary: {
							dataRowCount,
							exportTime: new Date().toISOString(),
							eventId: eventId ?? 'all'
						},
						data
					},
					null,
					2
				);
				mimeType = 'application/json';
				extension = 'json';
			} else {
				const headerNote = `# 取数口径说明`;
				const caliberLines = [
					`# 模块范围: ${caliber.scope}`,
					`# 活动ID: ${eventId ?? '全部活动'}`,
					`# 时间范围: ${caliber.timeRange?.startDate ?? '不限'} ~ ${caliber.timeRange?.endDate ?? '不限'}`,
					`# 筛选条件: ${JSON.stringify(caliber.filters)}`,
					`# 聚合规则: ${caliber.aggregationRules.join('; ')}`,
					`# 取数时间: ${caliber.calculatedAt}`,
					`# 操作人: ${caliber.operator}`,
					`# 数据行数: ${dataRowCount}`,
					''
				];

				const csvBody = data.length > 0 ? toCSV(data) : '';
				content = [headerNote, ...caliberLines, csvBody].join('\n');
				mimeType = 'text/csv; charset=utf-8';
				extension = 'csv';
			}

			return {
				fileName: `${fileName}.${extension}`,
				mimeType,
				content,
				caliber,
				rowCount: dataRowCount
			};
		})
});

function getAggregationRules(module: ExportModule): string[] {
	switch (module) {
		case 'sponsors':
			return [
				'按赞助单维度聚合',
				'总票数=该赞助下所有赞助票明细数量之和',
				'总金额为合同约定金额，非实收金额',
				'状态字段取值: pending待确认/confirmed已确认/partial部分完成/completed全部完成'
			];
		case 'sponsor-tickets':
			return [
				'按赞助票明细维度输出',
				'单位面额=票面价值，非实际销售价',
				'交付日期为物料交接确认日期'
			];
		case 'verifications':
			return [
				'按每张核销码维度输出',
				'核销时间为最近一次核验通过时间',
				'状态: issued已发放/pending待激活/verified已核销/expired已过期/refunded已退款/cancelled已作废',
				'核销渠道: gate闸机/manual人工/online在线/self自助'
			];
		case 'ticket-types':
			return [
				'按票种维度聚合',
				'可用库存=总配额-已售-预占',
				'退票策略: non_refundable不可退/partial_refund部分退还/full_refund_before_date时限前全退'
			];
		case 'orders':
			return [
				'按订单维度聚合',
				'实付金额=支付成功金额-退款金额',
				'订单状态: created待支付/paid已支付/issuing出票中/issued已出票/partial_refund部分退款/refunded全部退款/cancelled已取消'
			];
		case 'order-items':
			return [
				'按订单项逐行输出',
				'每张票对应一行（quantity=1）',
				'退票金额为实际退款金额（含平台扣费后）'
			];
		case 'disputes':
			return [
				'按异常单维度输出',
				'影响范围为人工评估+系统检测合并结果',
				'责任归属: buyer购票人/operator操作人/system系统/third_party第三方/venue场馆/undetermined待定',
				'处理方式: full_refund全额退/partial_refund部分退/compensation补偿/ticket_reissue重出票/denied不予处理/other其他',
				'异常单状态: open待处理/investigating调查中/pending_approval待审批/resolved已解决/closed已归档'
			];
		case 'verification-stats':
			return [
				'按小时聚合核销数量',
				'仅统计status=verified的记录',
				'核销时间采用verify_time字段（非创建时间）'
			];
		default:
			return [];
	}
}

async function exportSponsors(
	ctx: any,
	eventId?: string,
	dateRange?: any,
	filters?: any
) {
	const where = [];
	if (eventId) where.push(eq(sponsors.eventId, eventId));
	if (dateRange?.startDate) where.push(gte(sponsors.createdAt, dateRange.startDate));
	if (dateRange?.endDate) where.push(lte(sponsors.createdAt, dateRange.endDate));
	if (filters?.level) where.push(eq(sponsors.sponsorLevel, filters.level));
	if (filters?.status) where.push(eq(sponsors.status, filters.status));

	return await ctx.db
		.select({
			赞助单ID: sponsors.id,
			活动名称: events.name,
			赞助方: sponsors.name,
			等级: sponsors.sponsorLevel,
			联系人: sponsors.contactPerson,
			联系电话: sponsors.contactPhone,
			合同编号: sponsors.contractNo,
			总票数: sponsors.totalTickets,
			合同金额_元: sponsors.totalAmount,
			状态: sponsors.status,
			备注: sponsors.notes,
			创建时间: sponsors.createdAt,
			更新时间: sponsors.updatedAt
		})
		.from(sponsors)
		.leftJoin(events, eq(sponsors.eventId, events.id))
		.where(where.length ? and(...where) : undefined)
		.orderBy(sql`${sponsors.createdAt} DESC`);
}

async function exportSponsorTickets(ctx: any, eventId?: string, dateRange?: any, filters?: any) {
	const where = [];
	if (eventId) where.push(eq(sponsors.eventId, eventId));
	if (dateRange?.startDate) where.push(gte(sponsorTickets.createdAt, dateRange.startDate));
	if (dateRange?.endDate) where.push(lte(sponsorTickets.createdAt, dateRange.endDate));

	return await ctx.db
		.select({
			明细ID: sponsorTickets.id,
			赞助方: sponsors.name,
			票种名称: ticketTypes.name,
			数量: sponsorTickets.quantity,
			单位面额_元: sponsorTickets.unitValue,
			交付日期: sponsorTickets.deliveredDate,
			接收人: users.displayName,
			交接备注: sponsorTickets.deliveryNotes,
			创建时间: sponsorTickets.createdAt
		})
		.from(sponsorTickets)
		.leftJoin(sponsors, eq(sponsorTickets.sponsorId, sponsors.id))
		.leftJoin(ticketTypes, eq(sponsorTickets.ticketTypeId, ticketTypes.id))
		.leftJoin(users, eq(sponsorTickets.receivedBy, users.id))
		.where(where.length ? and(...where) : undefined)
		.orderBy(sql`${sponsorTickets.createdAt} DESC`);
}

async function exportVerifications(ctx: any, eventId?: string, dateRange?: any, filters?: any) {
	const where = [];
	if (eventId) where.push(eq(verifications.eventId, eventId));
	if (dateRange?.startDate) where.push(gte(verifications.createdAt, dateRange.startDate));
	if (dateRange?.endDate) where.push(lte(verifications.createdAt, dateRange.endDate));
	if (filters?.sourceType) where.push(eq(verifications.sourceType, filters.sourceType));
	if (filters?.status) where.push(eq(verifications.status, filters.status));

	return await ctx.db
		.select({
			核销ID: verifications.id,
			活动名称: events.name,
			核销序列号: verifications.serialNumber,
			来源类型: verifications.sourceType,
			票种名称: ticketTypes.name,
			持票人: verifications.holderName,
			手机号: verifications.holderPhone,
			证件号: verifications.holderIdCard,
			状态: verifications.status,
			核销时间: verifications.verifyTime,
			核销渠道: verifications.verifyChannel,
			核验人: users.displayName,
			核验设备: verifications.verifyDevice,
			核验次数: verifications.checkinCount,
			备注: verifications.notes,
			发放时间: verifications.createdAt
		})
		.from(verifications)
		.leftJoin(events, eq(verifications.eventId, events.id))
		.leftJoin(ticketTypes, eq(verifications.ticketTypeId, ticketTypes.id))
		.leftJoin(users, eq(verifications.verifyOperatorId, users.id))
		.where(where.length ? and(...where) : undefined)
		.orderBy(sql`${verifications.createdAt} DESC`);
}

async function exportTicketTypes(ctx: any, eventId?: string) {
	return await ctx.db
		.select({
			票种ID: ticketTypes.id,
			活动名称: events.name,
			票种编码: ticketTypes.code,
			票种名称: ticketTypes.name,
			类别: ticketTypes.category,
			售价_元: ticketTypes.price,
			成本_元: ticketTypes.costPrice,
			总配额: ticketTypes.totalQuota,
			已售: ticketTypes.soldQuota,
			预占: ticketTypes.heldQuota,
			可用库存: sql<number>`${ticketTypes.totalQuota} - ${ticketTypes.soldQuota} - ${ticketTypes.heldQuota}`,
			退票策略: ticketTypes.refundPolicy,
			退票截止时间: ticketTypes.refundDeadline,
			允许转赠: ticketTypes.transferAllowed,
			开售时间: ticketTypes.saleStartTime,
			停售时间: ticketTypes.saleEndTime,
			状态: ticketTypes.status,
			创建时间: ticketTypes.createdAt
		})
		.from(ticketTypes)
		.leftJoin(events, eq(ticketTypes.eventId, events.id))
		.where(eventId ? eq(ticketTypes.eventId, eventId) : undefined)
		.orderBy(sql`${ticketTypes.createdAt} DESC`);
}

async function exportOrders(ctx: any, eventId?: string, dateRange?: any, filters?: any) {
	const where = [];
	if (eventId) where.push(eq(orders.eventId, eventId));
	if (dateRange?.startDate) where.push(gte(orders.createdAt, dateRange.startDate));
	if (dateRange?.endDate) where.push(lte(orders.createdAt, dateRange.endDate));
	if (filters?.channel) where.push(eq(orders.channel, filters.channel));
	if (filters?.status) where.push(eq(orders.status, filters.status));
	if (filters?.paymentStatus) where.push(eq(orders.paymentStatus, filters.paymentStatus));

	return await ctx.db
		.select({
			订单ID: orders.id,
			订单号: orders.orderNo,
			活动名称: events.name,
			渠道: orders.channel,
			第三方来源: orders.thirdPartySource,
			购票人: orders.buyerName,
			联系电话: orders.buyerPhone,
			邮箱: orders.buyerEmail,
			票面总额_元: orders.totalAmount,
			票数: orders.totalQuantity,
			优惠_元: orders.discountAmount,
			实付_元: orders.paidAmount,
			服务费_元: orders.serviceFee,
			支付方式: orders.paymentMethod,
			支付状态: orders.paymentStatus,
			支付时间: orders.paymentTime,
			交易流水号: orders.transactionId,
			订单状态: orders.status,
			取消原因: orders.cancelReason,
			到期时间: orders.expireTime,
			备注: orders.notes,
			创建时间: orders.createdAt,
			更新时间: orders.updatedAt
		})
		.from(orders)
		.leftJoin(events, eq(orders.eventId, events.id))
		.where(where.length ? and(...where) : undefined)
		.orderBy(sql`${orders.createdAt} DESC`);
}

async function exportOrderItems(ctx: any, eventId?: string, dateRange?: any, filters?: any) {
	const where = [];
	if (eventId) where.push(eq(orders.eventId, eventId));
	if (dateRange?.startDate) where.push(gte(orderItems.createdAt, dateRange.startDate));
	if (dateRange?.endDate) where.push(lte(orderItems.createdAt, dateRange.endDate));

	return await ctx.db
		.select({
			订单项ID: orderItems.id,
			订单号: orders.orderNo,
			票种名称: ticketTypes.name,
			单价_元: orderItems.unitPrice,
			小计_元: orderItems.totalPrice,
			持票人: orderItems.holderName,
			联系电话: orderItems.holderPhone,
			证件号: orderItems.holderIdCard,
			核销序列号: verifications.serialNumber,
			状态: orderItems.status,
			退款金额_元: orderItems.refundAmount,
			创建时间: orderItems.createdAt
		})
		.from(orderItems)
		.leftJoin(orders, eq(orderItems.orderId, orders.id))
		.leftJoin(ticketTypes, eq(orderItems.ticketTypeId, ticketTypes.id))
		.leftJoin(verifications, eq(orderItems.verificationId, verifications.id))
		.where(where.length ? and(...where) : undefined)
		.orderBy(sql`${orderItems.createdAt} DESC`);
}

async function exportDisputes(ctx: any, eventId?: string, dateRange?: any, filters?: any) {
	const where = [];
	if (eventId) where.push(eq(disputeTickets.eventId, eventId));
	if (dateRange?.startDate) where.push(gte(disputeTickets.createdAt, dateRange.startDate));
	if (dateRange?.endDate) where.push(lte(disputeTickets.createdAt, dateRange.endDate));
	if (filters?.type) where.push(eq(disputeTickets.type, filters.type));
	if (filters?.status) where.push(eq(disputeTickets.status, filters.status));
	if (filters?.severity) where.push(eq(disputeTickets.severity, filters.severity));

	const assignees = alias(users, 'assignees');
	const approvers = alias(users, 'approvers');
	const reporters = alias(users, 'reporters');

	return await ctx.db
		.select({
			异常单ID: disputeTickets.id,
			案件号: disputeTickets.caseNo,
			活动名称: events.name,
			类型: disputeTickets.type,
			来源: disputeTickets.sourceType,
			关联订单号: orders.orderNo,
			标题: disputeTickets.title,
			描述: disputeTickets.description,
			严重级别: disputeTickets.severity,
			影响订单数: sql`${disputeTickets.impactScope}->>'orderCount'`,
			影响票数: sql`${disputeTickets.impactScope}->>'ticketCount'`,
			涉及金额_元: sql`${disputeTickets.impactScope}->>'involvedAmount'`,
			责任归属: disputeTickets.partyResponsible,
			责任说明: disputeTickets.responsibilityDetail,
			状态: disputeTickets.status,
			处理方式: disputeTickets.resolution,
			处理详情: disputeTickets.resolutionDetail,
			退款金额_元: disputeTickets.refundAmount,
			补偿金额_元: disputeTickets.compensationAmount,
			处理人: assignees.displayName,
			审批人: approvers.displayName,
			报告人: reporters.displayName,
			报告时间: disputeTickets.reportedAt,
			完成时间: disputeTickets.resolvedAt,
			归档时间: disputeTickets.closedAt,
			创建时间: disputeTickets.createdAt
		})
		.from(disputeTickets)
		.leftJoin(events, eq(disputeTickets.eventId, events.id))
		.leftJoin(orders, eq(disputeTickets.relatedOrderId, orders.id))
		.leftJoin(assignees, eq(disputeTickets.assignedTo, assignees.id))
		.leftJoin(approvers, eq(disputeTickets.approverId, approvers.id))
		.leftJoin(reporters, eq(disputeTickets.reportedBy, reporters.id))
		.where(where.length ? and(...where) : undefined)
		.orderBy(sql`${disputeTickets.createdAt} DESC`);
}

async function exportVerificationStats(ctx: any, eventId?: string, dateRange?: any) {
	const where = [sql`${verifications.verifyTime} IS NOT NULL`];
	if (eventId) where.push(eq(verifications.eventId, eventId));
	if (dateRange?.startDate) where.push(gte(verifications.verifyTime, dateRange.startDate));
	if (dateRange?.endDate) where.push(lte(verifications.verifyTime, dateRange.endDate));

	return await ctx.db
		.select({
			日期小时: sql<string>`to_char(${verifications.verifyTime}, 'YYYY-MM-DD HH24:00')`,
			活动名称: events.name,
			核销来源: verifications.sourceType,
			核销渠道: verifications.verifyChannel,
			核销数量: sql<number>`count(*)`
		})
		.from(verifications)
		.leftJoin(events, eq(verifications.eventId, events.id))
		.where(and(...where))
		.groupBy(sql`1, 2, 3, 4`)
		.orderBy(sql`1`);
}

function toCSV(data: any[]): string {
	if (data.length === 0) return '';
	const headers = Object.keys(data[0]);
	const esc = (v: any) => {
		if (v === null || v === undefined) return '';
		const s = String(v).replace(/"/g, '""');
		return /[",\n]/.test(s) ? `"${s}"` : s;
	};
	const lines = [
		headers.join(','),
		...data.map((row) => headers.map((h) => esc(row[h])).join(','))
	];
	return lines.join('\n');
}
