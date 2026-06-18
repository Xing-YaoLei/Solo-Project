export async function apiFetch<T>(
	endpoint: string,
	options: RequestInit = {},
	useArrow = false
): Promise<T> {
	const headers: Record<string, string> = {
		...(options.headers as Record<string, string>)
	};

	if (!headers['Content-Type'] && options.body && !(options.body instanceof FormData)) {
		headers['Content-Type'] = 'application/json';
	}

	if (useArrow) {
		headers['Accept'] = 'application/vnd.apache.arrow.file';
	}

	const res = await fetch(endpoint, {
		...options,
		headers
	});

	if (!res.ok) {
		const err = await res.json().catch(() => ({ error: '请求失败' }));
		throw new Error(err.error || `HTTP ${res.status}`);
	}

	if (useArrow) {
		return (await res.arrayBuffer()) as unknown as T;
	}

	const ct = res.headers.get('content-type') ?? '';
	if (ct.includes('application/vnd.apache.arrow.file')) {
		return (await res.arrayBuffer()) as unknown as T;
	}

	return res.json();
}

export function formatNumber(n: number): string {
	if (n >= 10000) {
		return (n / 10000).toFixed(1) + '万';
	}
	return n.toLocaleString('zh-CN');
}

export function formatPercent(n: number): string {
	return n.toFixed(1) + '%';
}

export function statusLabel(s: string): string {
	const map: Record<string, string> = {
		appointed: '已预约',
		arrived: '已到店',
		completed: '试驾完成',
		no_show: '试驾爽约',
		closed: '已成交'
	};
	return map[s] ?? s;
}

export function sourceLabel(s: string): string {
	const map: Record<string, string> = {
		finance: '金融审批',
		crm: 'CRM系统',
		inspection: '车辆检测'
	};
	return map[s] ?? s;
}

export function batchStatusLabel(s: string): string {
	const map: Record<string, string> = {
		processing: '处理中',
		merged: '已合并',
		failed: '失败'
	};
	return map[s] ?? s;
}
