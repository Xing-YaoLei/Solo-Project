export function formatDateTime(d: any): string {
	if (!d) return '-';
	const date = typeof d === 'string' || typeof d === 'number' ? new Date(d) : d;
	if (isNaN(date.getTime())) return String(d);
	return date.toLocaleString('zh-CN', {
		year: 'numeric',
		month: '2-digit',
		day: '2-digit',
		hour: '2-digit',
		minute: '2-digit',
		second: undefined
	});
}

export function formatDate(d: any): string {
	if (!d) return '-';
	const date = typeof d === 'string' || typeof d === 'number' ? new Date(d) : d;
	if (isNaN(date.getTime())) return String(d);
	return date.toLocaleDateString('zh-CN');
}

export function formatMoney(n: any): string {
	const v = Number(n ?? 0);
	return v.toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export function downloadBlob(content: string, filename: string, mimeType: string) {
	const BOM = mimeType.includes('csv') || mimeType.includes('text') ? '\uFEFF' : '';
	const blob = new Blob([BOM + content], { type: mimeType });
	const url = URL.createObjectURL(blob);
	const a = document.createElement('a');
	a.href = url;
	a.download = filename;
	document.body.appendChild(a);
	a.click();
	document.body.removeChild(a);
	URL.revokeObjectURL(url);
}

export function statusBadge(status: string): { cls: string; label: string } {
	const map: Record<string, { cls: string; label: string }> = {
		pending: { cls: 'badge-yellow', label: '待确认' },
		confirmed: { cls: 'badge-blue', label: '已确认' },
		partial: { cls: 'badge-orange', label: '部分完成' },
		completed: { cls: 'badge-green', label: '全部完成' },
		draft: { cls: 'badge-gray', label: '草稿' },
		ready: { cls: 'badge-blue', label: '准备中' },
		selling: { cls: 'badge-green', label: '售票中' },
		ended: { cls: 'badge-gray', label: '已结束' },
		cancelled: { cls: 'badge-red', label: '已取消' },
		issued: { cls: 'badge-blue', label: '已发放' },
		verified: { cls: 'badge-green', label: '已核销' },
		expired: { cls: 'badge-gray', label: '已过期' },
		refunded: { cls: 'badge-purple', label: '已退款' },
		active: { cls: 'badge-green', label: '启用' },
		inactive: { cls: 'badge-gray', label: '停用' },
		sold_out: { cls: 'badge-red', label: '售罄' },
		created: { cls: 'badge-gray', label: '待支付' },
		paid: { cls: 'badge-blue', label: '已支付' },
		issuing: { cls: 'badge-yellow', label: '出票中' },
		open: { cls: 'badge-red', label: '待处理' },
		investigating: { cls: 'badge-yellow', label: '调查中' },
		pending_approval: { cls: 'badge-orange', label: '待审批' },
		resolved: { cls: 'badge-green', label: '已解决' },
		closed: { cls: 'badge-gray', label: '已归档' },
		available: { cls: 'badge-green', label: '可售' },
		held: { cls: 'badge-yellow', label: '预占' },
		sold: { cls: 'badge-blue', label: '已售' },
		reserved: { cls: 'badge-purple', label: '预留' },
		disabled: { cls: 'badge-gray', label: '禁用' },
		not_for_sale: { cls: 'badge-gray', label: '非卖' },
		unpaid: { cls: 'badge-gray', label: '未支付' },
		failed: { cls: 'badge-red', label: '支付失败' },
		partial_refund: { cls: 'badge-orange', label: '部分退款' }
	};
	return map[status] ?? { cls: 'badge-gray', label: status };
}
