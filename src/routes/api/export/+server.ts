import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { createCaller } from '$server/trpc/caller';
import type { RequestEvent } from '@sveltejs/kit';

function generateCsv(headers: string[], rows: (string | number)[][]): string {
	const escape = (val: any): string => {
		const str = String(val ?? '');
		if (str.includes(',') || str.includes('"') || str.includes('\n')) {
			return `"${str.replace(/"/g, '""')}"`;
		}
		return str;
	};
	return [headers.map(escape).join(','), ...rows.map((r) => r.map(escape).join(','))].join('\n');
}

function formatDate(d: string | Date | null | undefined): string {
	if (!d) return '';
	return new Date(d).toLocaleString('zh-CN');
}

export const GET: RequestHandler = async (event: RequestEvent) => {
	if (!event.locals.user) {
		throw error(401, '请先登录');
	}

	const caller = await createCaller(event);
	const url = event.url;
	const type = url.searchParams.get('type') ?? 'all';
	const startDate = url.searchParams.get('startDate') ?? undefined;
	const endDate = url.searchParams.get('endDate') ?? undefined;

	try {
		let filename = 'complaint_report';
		let csvContent = '';

		if (type === 'all' || type === 'complaints') {
			const list = await caller.complaint.list({
				page: 1,
				pageSize: 500
			});

			const headers = ['投诉编号', '描述', '状态', '问题标签', '游客', '处理人', '创建时间', '截止时间', '是否超时'];
			const rows = list.items.map((c: any) => [
				c.id.slice(0, 12),
				c.description?.replace(/\n/g, ' ') ?? '',
				c.status,
				(c.tags ?? []).map((t: any) => t.label).join('|'),
				c.visitorName ?? '',
				c.assigneeName ?? '',
				formatDate(c.createdAt),
				formatDate(c.deadline),
				c.isOverdue ? '是' : '否'
			]);

			csvContent += '=== 投诉数据 ===\n';
			csvContent += generateCsv(headers, rows) + '\n\n';
			filename = 'complaints_export';
		}

		if (type === 'all' || type === 'duration') {
			const duration = await caller.report.byClosureDuration();
			const headers = ['时长区间', '数量', '平均关闭时长(小时)'];
			const rows = duration.buckets.map((b: any) => [b.label, b.count, b.avgHours.toFixed(2)]);
			csvContent += '=== 关闭时长分布 ===\n';
			csvContent += generateCsv(headers, rows) + '\n\n';
		}

		if (type === 'all' || type === 'date') {
			const dateRpt = await caller.report.byDate({ startDate, endDate });
			const headers = ['日期', '总数', '待处理', '处理中', '已解决', '已关闭'];
			const rows = dateRpt.dates.map((d: any) => [
				d.date, d.total, d.pending, d.inProgress, d.resolved, d.closed
			]);
			csvContent += '=== 日期趋势 ===\n';
			csvContent += generateCsv(headers, rows) + '\n\n';
		}

		if (type === 'all' || type === 'assignee') {
			const assigneeRpt = await caller.report.byAssignee();
			const headers = ['负责人', '总数', '待处理', '已解决', '已关闭', '平均关闭时长(小时)'];
			const rows = assigneeRpt.assignees.map((a: any) => [
				a.assigneeName ?? '未分配', a.total, a.pending, a.resolved, a.closed, a.avgCloseHours.toFixed(2)
			]);
			csvContent += '=== 负责人统计 ===\n';
			csvContent += generateCsv(headers, rows) + '\n\n';
		}

		const bom = '\uFEFF';
		return new Response(bom + csvContent, {
			headers: {
				'Content-Type': 'text/csv; charset=utf-8',
				'Content-Disposition': `attachment; filename="${filename}_${Date.now()}.csv"`
			}
		});
	} catch (e: any) {
		throw error(500, e?.message || '导出失败');
	}
};
