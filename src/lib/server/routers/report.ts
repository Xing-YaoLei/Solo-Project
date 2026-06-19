import { z } from 'zod';
import { router, protectedProcedure, managerProcedure } from '../trpc';
import { cleaningTaskTable, anomalyTable, complaintTable, userTable, propertyTable, bookingTable } from '../db/schema';
import { eq, and, gte, lte, desc, asc, count, sql, sum } from 'drizzle-orm';
import * as XLSX from 'xlsx';

export const reportRouter = router({
	getSummary: protectedProcedure
		.input(
			z.object({
				startDate: z.date(),
				endDate: z.date(),
				cleanerId: z.string().optional(),
				propertyId: z.string().optional()
			})
		)
		.query(async ({ ctx, input }) => {
			const conditions = [
				gte(cleaningTaskTable.scheduledDate, input.startDate.getTime()),
				lte(cleaningTaskTable.scheduledDate, input.endDate.getTime())
			];
			if (input.cleanerId) conditions.push(eq(cleaningTaskTable.assignedCleanerId, input.cleanerId));
			if (input.propertyId) conditions.push(eq(cleaningTaskTable.propertyId, input.propertyId));

			const where = and(...conditions);

			const tasks = await ctx.db.select().from(cleaningTaskTable).where(where).all();

			const totalTasks = tasks.length;
			const completedTasks = tasks.filter((t) => ['completed', 'verified'].includes(t.status)).length;
			const verifiedTasks = tasks.filter((t) => t.status === 'verified').length;
			const missedTasks = tasks.filter((t) => t.status === 'missed').length;
			const cancelledTasks = tasks.filter((t) => t.status === 'cancelled').length;
			const inProgressTasks = tasks.filter((t) => t.status === 'in_progress').length;
			const pendingTasks = tasks.filter((t) => ['pending', 'assigned', 'accepted'].includes(t.status)).length;

			const onTimeCompleted = tasks.filter((t) => {
				if (!t.actualEndTime || !t.deadlineTime) return ['completed', 'verified'].includes(t.status);
				return t.actualEndTime <= t.deadlineTime;
			}).length;

			const onTimeRate = completedTasks > 0 ? Math.round((onTimeCompleted / completedTasks) * 100) : 100;
			const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

			const avgQualityScore = tasks
				.filter((t) => t.qualityScore !== null)
				.reduce((acc, t) => acc + (t.qualityScore || 0), 0) /
				(tasks.filter((t) => t.qualityScore !== null).length || 1);

			return {
				summary: {
					totalTasks,
					completedTasks,
					verifiedTasks,
					missedTasks,
					cancelledTasks,
					inProgressTasks,
					pendingTasks,
					onTimeCompleted,
					onTimeRate,
					completionRate,
					avgQualityScore: Math.round(avgQualityScore * 10) / 10
				},
				tasks
			};
		}),

	getCleanerPerformance: protectedProcedure
		.input(
			z.object({
				startDate: z.date(),
				endDate: z.date()
			})
		)
		.query(async ({ ctx, input }) => {
			const cleaners = await ctx.db
				.select()
				.from(userTable)
				.where(eq(userTable.role, 'cleaner'))
				.orderBy(asc(userTable.realName))
				.all();

			const results = [];
			for (const cleaner of cleaners) {
				const tasks = await ctx.db
					.select()
					.from(cleaningTaskTable)
					.where(
						and(
							eq(cleaningTaskTable.assignedCleanerId, cleaner.id),
							gte(cleaningTaskTable.scheduledDate, input.startDate.getTime()),
							lte(cleaningTaskTable.scheduledDate, input.endDate.getTime())
						)
					)
					.all();

				const total = tasks.length;
				const completed = tasks.filter((t) => ['completed', 'verified'].includes(t.status)).length;
				const onTime = tasks.filter((t) => {
					if (!t.actualEndTime || !t.deadlineTime) return ['completed', 'verified'].includes(t.status);
					return t.actualEndTime <= t.deadlineTime;
				}).length;
				const missed = tasks.filter((t) => t.status === 'missed').length;
				const avgScore = tasks
					.filter((t) => t.qualityScore !== null)
					.reduce((a, t) => a + (t.qualityScore || 0), 0) /
					(tasks.filter((t) => t.qualityScore !== null).length || 1);

				results.push({
					cleaner,
					total,
					completed,
					missed,
					onTime,
					onTimeRate: completed > 0 ? Math.round((onTime / completed) * 100) : 100,
					completionRate: total > 0 ? Math.round((completed / total) * 100) : 0,
					avgQualityScore: Math.round(avgScore * 10) / 10
				});
			}

			return results.sort((a, b) => b.onTimeRate - a.onTimeRate);
		}),

	getPropertyStats: protectedProcedure
		.input(
			z.object({
				startDate: z.date(),
				endDate: z.date()
			})
		)
		.query(async ({ ctx, input }) => {
			const properties = await ctx.db.select().from(propertyTable).orderBy(asc(propertyTable.name)).all();

			const results = [];
			for (const prop of properties) {
				const [taskCount, bookingCount, complaintCount, anomalyCount] = await Promise.all([
					ctx.db
						.select()
						.from(cleaningTaskTable)
						.where(
							and(
								eq(cleaningTaskTable.propertyId, prop.id),
								gte(cleaningTaskTable.scheduledDate, input.startDate.getTime()),
								lte(cleaningTaskTable.scheduledDate, input.endDate.getTime())
							)
						)
						.all(),
					ctx.db
						.select()
						.from(bookingTable)
						.where(
							and(
								eq(bookingTable.propertyId, prop.id),
								gte(bookingTable.checkInDate, input.startDate.getTime()),
								lte(bookingTable.checkInDate, input.endDate.getTime())
							)
						)
						.all(),
					ctx.db
						.select()
						.from(complaintTable)
						.where(
							and(
								eq(complaintTable.propertyId, prop.id),
								gte(complaintTable.filedAt, input.startDate.getTime()),
								lte(complaintTable.filedAt, input.endDate.getTime())
							)
						)
						.all(),
					ctx.db
						.select()
						.from(anomalyTable)
						.where(
							and(
								eq(anomalyTable.propertyId, prop.id),
								gte(anomalyTable.discoveredAt, input.startDate.getTime()),
								lte(anomalyTable.discoveredAt, input.endDate.getTime())
							)
						)
						.all()
				]);

				const completedTasks = taskCount.filter((t) => ['completed', 'verified'].includes(t.status)).length;
				const onTimeTasks = taskCount.filter((t) => {
					if (!t.actualEndTime || !t.deadlineTime) return ['completed', 'verified'].includes(t.status);
					return t.actualEndTime <= t.deadlineTime;
				}).length;

				results.push({
					property: prop,
					tasks: taskCount.length,
					completedTasks,
					onTimeRate: completedTasks > 0 ? Math.round((onTimeTasks / completedTasks) * 100) : 100,
					bookings: bookingCount.length,
					complaints: complaintCount.length,
					anomalies: anomalyCount.length
				});
			}

			return results;
		}),

	getAnomalyStats: protectedProcedure
		.input(
			z.object({
				startDate: z.date(),
				endDate: z.date()
			})
		)
		.query(async ({ ctx, input }) => {
			const anomalies = await ctx.db
				.select()
				.from(anomalyTable)
				.where(
					and(
						gte(anomalyTable.discoveredAt, input.startDate.getTime()),
						lte(anomalyTable.discoveredAt, input.endDate.getTime())
					)
				)
				.all();

			const typeStats = {} as Record<string, number>;
			const statusStats = {} as Record<string, number>;
			const impactStats = {} as Record<string, number>;

			for (const a of anomalies) {
				typeStats[a.type] = (typeStats[a.type] || 0) + 1;
				statusStats[a.status] = (statusStats[a.status] || 0) + 1;
				impactStats[a.impactLevel] = (impactStats[a.impactLevel] || 0) + 1;
			}

			const totalCompensation = anomalies.reduce((a, t) => a + (t.compensation || 0), 0);

			return {
				total: anomalies.length,
				pending: anomalies.filter((a) => a.status === 'pending').length,
				handling: anomalies.filter((a) => a.status === 'handling').length,
				resolved: anomalies.filter((a) => a.status === 'resolved').length,
				closed: anomalies.filter((a) => a.status === 'closed').length,
				typeStats,
				statusStats,
				impactStats,
				totalCompensation
			};
		}),

	exportReport: managerProcedure
		.input(
			z.object({
				startDate: z.date(),
				endDate: z.date(),
				reportType: z.enum(['tasks', 'cleaner_performance', 'property_stats', 'anomalies', 'complaints'])
			})
		)
		.mutation(async ({ ctx, input }) => {
			let data: any[] = [];
			let filename = '';
			const period = `${formatDate(input.startDate)}-${formatDate(input.endDate)}`;

			switch (input.reportType) {
				case 'tasks': {
					const tasks = await ctx.db
						.select({
							task: cleaningTaskTable,
							property: propertyTable,
							cleaner: userTable
						})
						.from(cleaningTaskTable)
						.leftJoin(propertyTable, eq(cleaningTaskTable.propertyId, propertyTable.id))
						.leftJoin(userTable, eq(cleaningTaskTable.assignedCleanerId, userTable.id))
						.where(
							and(
								gte(cleaningTaskTable.scheduledDate, input.startDate.getTime()),
								lte(cleaningTaskTable.scheduledDate, input.endDate.getTime())
							)
						)
						.orderBy(desc(cleaningTaskTable.scheduledDate))
						.all();

					data = tasks.map((r) => ({
						'任务ID': r.task.id,
						'房源': r.property?.name || '-',
						'保洁员': r.cleaner?.realName || '未分配',
						'计划日期': formatDate(new Date(r.task.scheduledDate)),
						'任务类型': getTaskTypeLabel(r.task.type),
						'优先级': getPriorityLabel(r.task.priority),
						'状态': getTaskStatusLabel(r.task.status),
						'开始时间': r.task.actualStartTime ? formatDateTime(new Date(r.task.actualStartTime)) : '-',
						'完成时间': r.task.actualEndTime ? formatDateTime(new Date(r.task.actualEndTime)) : '-',
						'截止时间': r.task.deadlineTime ? formatDateTime(new Date(r.task.deadlineTime)) : '-',
						'是否准时': getOnTimeLabel(r.task.actualEndTime, r.task.deadlineTime, r.task.status),
						'质量评分': r.task.qualityScore ?? '-',
						'备注': r.task.cleanerNotes || '-'
					}));
					filename = `保洁任务_${period}.xlsx`;
					break;
				}
				case 'cleaner_performance': {
					const perf = await ctx.db
						.select()
						.from(userTable)
						.where(eq(userTable.role, 'cleaner'))
						.all();
					const rows = [];
					for (const cleaner of perf) {
						const tasks = await ctx.db
							.select()
							.from(cleaningTaskTable)
							.where(
								and(
									eq(cleaningTaskTable.assignedCleanerId, cleaner.id),
									gte(cleaningTaskTable.scheduledDate, input.startDate.getTime()),
									lte(cleaningTaskTable.scheduledDate, input.endDate.getTime())
								)
							)
							.all();
						const total = tasks.length;
						const completed = tasks.filter((t) => ['completed', 'verified'].includes(t.status)).length;
						const onTime = tasks.filter((t) => {
							if (!t.actualEndTime || !t.deadlineTime) return ['completed', 'verified'].includes(t.status);
							return t.actualEndTime <= t.deadlineTime;
						}).length;
						const missed = tasks.filter((t) => t.status === 'missed').length;
						const avgScore = tasks.filter((t) => t.qualityScore !== null).reduce((a, t) => a + (t.qualityScore || 0), 0) /
							(tasks.filter((t) => t.qualityScore !== null).length || 1);

						rows.push({
							'保洁员': cleaner.realName,
							'用户名': cleaner.username,
							'联系电话': cleaner.phone || '-',
							'总任务数': total,
							'已完成': completed,
							'准时完成': onTime,
							'漏单': missed,
							'准时率(%)': completed > 0 ? Math.round((onTime / completed) * 100) : 100,
							'完成率(%)': total > 0 ? Math.round((completed / total) * 100) : 0,
							'平均质量分': Math.round(avgScore * 10) / 10
						});
					}
					data = rows;
					filename = `保洁员绩效_${period}.xlsx`;
					break;
				}
				case 'property_stats': {
					const props = await ctx.db.select().from(propertyTable).all();
					const rows = [];
					for (const prop of props) {
						const [tasks, bookings, complaints, anomalies] = await Promise.all([
							ctx.db.select().from(cleaningTaskTable).where(and(
								eq(cleaningTaskTable.propertyId, prop.id),
								gte(cleaningTaskTable.scheduledDate, input.startDate.getTime()),
								lte(cleaningTaskTable.scheduledDate, input.endDate.getTime())
							)).all(),
							ctx.db.select().from(bookingTable).where(and(
								eq(bookingTable.propertyId, prop.id),
								gte(bookingTable.checkInDate, input.startDate.getTime()),
								lte(bookingTable.checkInDate, input.endDate.getTime())
							)).all(),
							ctx.db.select().from(complaintTable).where(and(
								eq(complaintTable.propertyId, prop.id),
								gte(complaintTable.filedAt, input.startDate.getTime()),
								lte(complaintTable.filedAt, input.endDate.getTime())
							)).all(),
							ctx.db.select().from(anomalyTable).where(and(
								eq(anomalyTable.propertyId, prop.id),
								gte(anomalyTable.discoveredAt, input.startDate.getTime()),
								lte(anomalyTable.discoveredAt, input.endDate.getTime())
							)).all()
						]);
						const completed = tasks.filter((t) => ['completed', 'verified'].includes(t.status)).length;
						const onTime = tasks.filter((t) => {
							if (!t.actualEndTime || !t.deadlineTime) return ['completed', 'verified'].includes(t.status);
							return t.actualEndTime <= t.deadlineTime;
						}).length;
						rows.push({
							'房源名称': prop.name,
							'地址': prop.address,
							'房源类型': getPropertyTypeLabel(prop.type),
							'保洁任务数': tasks.length,
							'已完成': completed,
							'准时率(%)': completed > 0 ? Math.round((onTime / completed) * 100) : 100,
							'预订数': bookings.length,
							'客诉数': complaints.length,
							'异常单数': anomalies.length
						});
					}
					data = rows;
					filename = `房源统计_${period}.xlsx`;
					break;
				}
				case 'anomalies': {
					const items = await ctx.db
						.select({
							anomaly: anomalyTable,
							property: propertyTable,
							task: cleaningTaskTable,
							responsible: userTable
						})
						.from(anomalyTable)
						.leftJoin(propertyTable, eq(anomalyTable.propertyId, propertyTable.id))
						.leftJoin(cleaningTaskTable, eq(anomalyTable.taskId, cleaningTaskTable.id))
						.leftJoin(userTable, eq(anomalyTable.responsiblePersonId, userTable.id))
						.where(and(
							gte(anomalyTable.discoveredAt, input.startDate.getTime()),
							lte(anomalyTable.discoveredAt, input.endDate.getTime())
						))
						.orderBy(desc(anomalyTable.discoveredAt))
						.all();
					data = items.map((r) => ({
						'异常单号': r.anomaly.id,
						'类型': getAnomalyTypeLabel(r.anomaly.type),
						'标题': r.anomaly.title,
						'房源': r.property?.name || '-',
						'关联任务': r.task?.id || '-',
						'责任人': r.responsible?.realName || r.anomaly.responsibleRole || '-',
						'影响程度': getImpactLevelLabel(r.anomaly.impactLevel),
						'影响范围': r.anomaly.impactScope,
						'发现时间': formatDateTime(new Date(r.anomaly.discoveredAt)),
						'状态': getAnomalyStatusLabel(r.anomaly.status),
						'处理措施': r.anomaly.handlingMeasures || '-',
						'处理结论': r.anomaly.handlingConclusion || '-',
						'处罚': r.anomaly.penalty || '-',
						'赔偿金额': r.anomaly.compensation || 0
					}));
					filename = `异常单_${period}.xlsx`;
					break;
				}
				case 'complaints': {
					const items = await ctx.db
						.select({
							complaint: complaintTable,
							property: propertyTable,
							responsible: userTable
						})
						.from(complaintTable)
						.leftJoin(propertyTable, eq(complaintTable.propertyId, propertyTable.id))
						.leftJoin(userTable, eq(complaintTable.responsibleCleanerId, userTable.id))
						.where(and(
							gte(complaintTable.filedAt, input.startDate.getTime()),
							lte(complaintTable.filedAt, input.endDate.getTime())
						))
						.orderBy(desc(complaintTable.filedAt))
						.all();
					data = items.map((r) => ({
						'客诉编号': r.complaint.id,
						'标题': r.complaint.title,
						'内容': r.complaint.content,
						'来源': getComplaintSourceLabel(r.complaint.source),
						'严重程度': getSeverityLabel(r.complaint.severity),
						'房源': r.property?.name || '-',
						'责任人': r.responsible?.realName || '-',
						'标签': (r.complaint.tags || []).join(', '),
						'平台评分': r.complaint.reviewRating || '-',
						'状态': getComplaintStatusLabel(r.complaint.status),
						'处理结果': r.complaint.resolution || '-',
						'赔偿金额': r.complaint.compensation || 0,
						'提交时间': formatDateTime(new Date(r.complaint.filedAt))
					}));
					filename = `客诉记录_${period}.xlsx`;
					break;
				}
			}

			const metricDescription = getReportMetricDescription(input.reportType);

			const wb = XLSX.utils.book_new();
			const wsData = XLSX.utils.json_to_sheet(data);
			XLSX.utils.book_append_sheet(wb, wsData, '数据');

			const descSheet = XLSX.utils.json_to_sheet(
				Object.entries(metricDescription).map(([k, v]) => ({ '指标名称': k, '口径说明': v }))
			);
			XLSX.utils.book_append_sheet(wb, descSheet, '口径说明');

			const buffer = XLSX.write(wb, { type: 'array', bookType: 'xlsx' });
			const base64 = Buffer.from(buffer).toString('base64');

			return {
				filename,
				base64,
				rowCount: data.length,
				metricDescription
			};
		})
});

function formatDate(date: Date): string {
	const y = date.getFullYear();
	const m = String(date.getMonth() + 1).padStart(2, '0');
	const d = String(date.getDate()).padStart(2, '0');
	return `${y}${m}${d}`;
}

function formatDateTime(date: Date): string {
	const y = date.getFullYear();
	const m = String(date.getMonth() + 1).padStart(2, '0');
	const d = String(date.getDate()).padStart(2, '0');
	const h = String(date.getHours()).padStart(2, '0');
	const min = String(date.getMinutes()).padStart(2, '0');
	return `${y}-${m}-${d} ${h}:${min}`;
}

function getTaskTypeLabel(type: string): string {
	const map: Record<string, string> = {
		checkout_cleaning: '退房保洁',
		periodic_cleaning: '日常保洁',
		deep_cleaning: '深度清洁',
		maintenance: '维修保养'
	};
	return map[type] || type;
}

function getPriorityLabel(p: string): string {
	const map: Record<string, string> = { low: '低', medium: '中', high: '高', urgent: '紧急' };
	return map[p] || p;
}

function getTaskStatusLabel(s: string): string {
	const map: Record<string, string> = {
		pending: '待分配', assigned: '已分配', accepted: '已接单', in_progress: '进行中',
		completed: '已完成', verified: '已验收', cancelled: '已取消', missed: '漏单'
	};
	return map[s] || s;
}

function getOnTimeLabel(end: number | null, deadline: number | null, status: string): string {
	if (!['completed', 'verified'].includes(status)) return '-';
	if (!end || !deadline) return '未设置截止时间';
	return end <= deadline ? '是' : '否';
}

function getPropertyTypeLabel(t: string): string {
	const map: Record<string, string> = { apartment: '公寓', house: '住宅', villa: '别墅', room: '房间' };
	return map[t] || t;
}

function getAnomalyTypeLabel(t: string): string {
	const map: Record<string, string> = {
		missed_cleaning: '保洁漏单', late_cleaning: '保洁超时', quality_issue: '质量问题', no_show: '爽约', other: '其他'
	};
	return map[t] || t;
}

function getAnomalyStatusLabel(s: string): string {
	const map: Record<string, string> = { pending: '待处理', handling: '处理中', resolved: '已解决', closed: '已关闭' };
	return map[s] || s;
}

function getImpactLevelLabel(l: string): string {
	const map: Record<string, string> = { low: '低', medium: '中', high: '高', critical: '严重' };
	return map[l] || l;
}

function getComplaintSourceLabel(s: string): string {
	const map: Record<string, string> = {
		guest: '客人投诉', platform_review: '平台点评', owner: '业主反馈', inspection: '巡检发现', other: '其他'
	};
	return map[s] || s;
}

function getComplaintStatusLabel(s: string): string {
	const map: Record<string, string> = { open: '待处理', investigating: '调查中', resolved: '已解决', closed: '已关闭' };
	return map[s] || s;
}

function getSeverityLabel(s: string): string {
	const map: Record<string, string> = { low: '低', medium: '中', high: '高', critical: '严重' };
	return map[s] || s;
}

function getReportMetricDescription(type: string): Record<string, string> {
	switch (type) {
		case 'tasks':
			return {
				'是否准时': '任务实际完成时间 <= 任务截止时间为「是」，否则为「否」。未设置截止时间的已完成任务标记为「未设置截止时间」',
				'质量评分': '由验收人根据保洁完成质量给出的0-100分评价',
				'状态': '待分配/已分配/已接单/进行中/已完成/已验收/已取消/漏单，漏单指超过截止时间未完成的任务'
			};
		case 'cleaner_performance':
			return {
				'准时率(%)': '公式：准时完成数 / 已完成数 × 100%。未设置截止时间的已完成任务计入准时完成数',
				'完成率(%)': '公式：已完成数 / 总任务数 × 100%。总任务数含已取消、漏单',
				'平均质量分': '该保洁员所有被验收任务的质量评分算术平均值，未被验收的任务不计入',
				'漏单': '任务状态为「漏单」的数量，通常指超过截止时间24小时仍未完成的任务'
			};
		case 'property_stats':
			return {
				'准时率(%)': '该房源所有已完成保洁任务中，按时完成的比例。公式：按时完成数 / 已完成数 × 100%',
				'预订数': '统计周期内该房源入住的订单数量（以入住日期为准）',
				'客诉数': '统计周期内该房源收到的所有投诉数量',
				'异常单数': '统计周期内该房源发生的保洁异常事件数量（漏单、超时、质量问题等）'
			};
		case 'anomalies':
			return {
				'类型': '保洁漏单（超过截止时间未保洁）、保洁超时（完成但超出截止时间）、质量问题（验收未通过）、爽约（保洁员未到岗）',
				'影响程度': '按对业务影响严重程度分级：低（无实质影响）、中（影响单订单）、高（导致客诉/差评）、严重（导致退款/平台处罚）',
				'状态': '待处理（刚创建未分配处理人）、处理中（已分配正在跟进）、已解决（措施已落实）、已关闭（后续跟进完成归档）'
			};
		case 'complaints':
			return {
				'严重程度': '低（客人轻微不满）、中（明确投诉）、高（要求赔偿/差评）、严重（平台介入/大额赔偿）',
				'来源': '客人直接投诉、平台公开点评、业主反馈、巡检时发现、其他渠道',
				'状态': '待处理→调查中→已解决→已关闭，完整闭环需填写处理结果并跟进客人反馈'
			};
		default:
			return {};
	}
}
