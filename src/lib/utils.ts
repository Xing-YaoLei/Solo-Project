export function formatDate(ts: number | Date | null | undefined): string {
	if (!ts) return '-';
	const d = typeof ts === 'number' ? new Date(ts) : ts;
	const y = d.getFullYear();
	const m = String(d.getMonth() + 1).padStart(2, '0');
	const day = String(d.getDate()).padStart(2, '0');
	return `${y}-${m}-${day}`;
}

export function formatDateTime(ts: number | Date | null | undefined): string {
	if (!ts) return '-';
	const d = typeof ts === 'number' ? new Date(ts) : ts;
	const y = d.getFullYear();
	const m = String(d.getMonth() + 1).padStart(2, '0');
	const day = String(d.getDate()).padStart(2, '0');
	const h = String(d.getHours()).padStart(2, '0');
	const min = String(d.getMinutes()).padStart(2, '0');
	return `${y}-${m}-${day} ${h}:${min}`;
}

export function getRoleLabel(role: string): string {
	const map: Record<string, string> = {
		admin: '系统管理员',
		manager: '运营经理',
		cleaner: '保洁员',
		viewer: '查看者'
	};
	return map[role] || role;
}

export function getTaskTypeLabel(type: string): string {
	const map: Record<string, string> = {
		checkout_cleaning: '退房保洁',
		periodic_cleaning: '日常保洁',
		deep_cleaning: '深度清洁',
		maintenance: '维修保养'
	};
	return map[type] || type;
}

export function getTaskStatusLabel(s: string): string {
	const map: Record<string, string> = {
		pending: '待分配',
		assigned: '已分配',
		accepted: '已接单',
		in_progress: '进行中',
		completed: '已完成',
		verified: '已验收',
		cancelled: '已取消',
		missed: '漏单'
	};
	return map[s] || s;
}

export function getStatusBadge(s: string): string {
	const map: Record<string, string> = {
		pending: 'gray',
		assigned: 'info',
		accepted: 'info',
		in_progress: 'warning',
		completed: 'success',
		verified: 'success',
		cancelled: 'gray',
		missed: 'danger'
	};
	return map[s] || 'gray';
}

export function getPriorityLabel(p: string): string {
	const map: Record<string, string> = { low: '低', medium: '中', high: '高', urgent: '紧急' };
	return map[p] || p;
}

export function getPriorityBadge(p: string): string {
	const map: Record<string, string> = { low: 'gray', medium: 'info', high: 'warning', urgent: 'danger' };
	return map[p] || 'gray';
}

export function getPropertyTypeLabel(t: string): string {
	const map: Record<string, string> = { apartment: '公寓', house: '住宅', villa: '别墅', room: '房间' };
	return map[t] || t;
}

export function getPropertyStatusLabel(s: string): string {
	const map: Record<string, string> = { active: '营业中', maintenance: '维修中', inactive: '已停用' };
	return map[s] || s;
}

export function getPropertyStatusBadge(s: string): string {
	const map: Record<string, string> = { active: 'success', maintenance: 'warning', inactive: 'gray' };
	return map[s] || 'gray';
}

export function getBookingStatusLabel(s: string): string {
	const map: Record<string, string> = {
		confirmed: '已确认',
		checked_in: '入住中',
		checked_out: '已退房',
		cancelled: '已取消'
	};
	return map[s] || s;
}

export function getBookingStatusBadge(s: string): string {
	const map: Record<string, string> = {
		confirmed: 'info',
		checked_in: 'success',
		checked_out: 'gray',
		cancelled: 'danger'
	};
	return map[s] || 'gray';
}

export function getSourceLabel(s: string): string {
	const map: Record<string, string> = {
		airbnb: 'Airbnb',
		tujia: '途家',
		xiaozhu: '小猪',
		meituan: '美团',
		direct: '直订',
		other: '其他'
	};
	return map[s] || s;
}

export function getIdTypeLabel(t: string): string {
	const map: Record<string, string> = {
		id_card: '身份证',
		passport: '护照',
		driver_license: '驾驶证',
		other: '其他'
	};
	return map[t] || t;
}

export function getComplaintSeverityLabel(s: string): string {
	const map: Record<string, string> = { low: '低', medium: '中', high: '高', critical: '严重' };
	return map[s] || s;
}

export function getComplaintSeverityBadge(s: string): string {
	const map: Record<string, string> = { low: 'gray', medium: 'warning', high: 'danger', critical: 'danger' };
	return map[s] || 'gray';
}

export function getComplaintStatusLabel(s: string): string {
	const map: Record<string, string> = {
		open: '待处理',
		investigating: '调查中',
		resolved: '已解决',
		closed: '已关闭'
	};
	return map[s] || s;
}

export function getComplaintStatusBadge(s: string): string {
	const map: Record<string, string> = {
		open: 'danger',
		investigating: 'warning',
		resolved: 'success',
		closed: 'gray'
	};
	return map[s] || 'gray';
}

export function getComplaintSourceLabel(s: string): string {
	const map: Record<string, string> = {
		guest: '客人投诉',
		platform_review: '平台点评',
		owner: '业主反馈',
		inspection: '巡检发现',
		other: '其他'
	};
	return map[s] || s;
}

export function getAnomalyTypeLabel(t: string): string {
	const map: Record<string, string> = {
		missed_cleaning: '保洁漏单',
		late_cleaning: '保洁超时',
		quality_issue: '质量问题',
		no_show: '爽约',
		other: '其他'
	};
	return map[t] || t;
}

export function getAnomalyTypeBadge(t: string): string {
	const map: Record<string, string> = {
		missed_cleaning: 'danger',
		late_cleaning: 'warning',
		quality_issue: 'warning',
		no_show: 'danger',
		other: 'gray'
	};
	return map[t] || 'gray';
}

export function getAnomalyStatusLabel(s: string): string {
	const map: Record<string, string> = {
		pending: '待处理',
		handling: '处理中',
		resolved: '已解决',
		closed: '已关闭'
	};
	return map[s] || s;
}

export function getAnomalyStatusBadge(s: string): string {
	const map: Record<string, string> = {
		pending: 'danger',
		handling: 'warning',
		resolved: 'success',
		closed: 'gray'
	};
	return map[s] || 'gray';
}

export function getImpactLevelLabel(l: string): string {
	const map: Record<string, string> = { low: '低', medium: '中', high: '高', critical: '严重' };
	return map[l] || l;
}

export function getImpactLevelBadge(l: string): string {
	const map: Record<string, string> = { low: 'gray', medium: 'warning', high: 'danger', critical: 'danger' };
	return map[l] || 'gray';
}

export function downloadBase64File(base64: string, filename: string) {
	const byteChars = atob(base64);
	const byteNums = new Array(byteChars.length);
	for (let i = 0; i < byteChars.length; i++) {
		byteNums[i] = byteChars.charCodeAt(i);
	}
	const byteArr = new Uint8Array(byteNums);
	const blob = new Blob([byteArr], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
	const url = URL.createObjectURL(blob);
	const a = document.createElement('a');
	a.href = url;
	a.download = filename;
	document.body.appendChild(a);
	a.click();
	document.body.removeChild(a);
	URL.revokeObjectURL(url);
}
