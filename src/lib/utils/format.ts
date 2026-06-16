import type { AssessmentStatus, ElderStatus, IncidentStatus } from '$shared/types';

export function ensureDate(date: Date | string | null | undefined): Date | null {
	if (!date) return null;
	if (date instanceof Date && !isNaN(date.getTime())) return date;
	if (typeof date === 'string') {
		const d = new Date(date);
		if (!isNaN(d.getTime())) return d;
	}
	return null;
}

export function formatDate(date: Date | string | null | undefined): string {
	const d = ensureDate(date);
	if (!d) return '-';
	const year = d.getFullYear();
	const month = String(d.getMonth() + 1).padStart(2, '0');
	const day = String(d.getDate()).padStart(2, '0');
	return `${year}-${month}-${day}`;
}

export function formatDateTime(date: Date | string | null | undefined): string {
	const d = ensureDate(date);
	if (!d) return '-';
	const year = d.getFullYear();
	const month = String(d.getMonth() + 1).padStart(2, '0');
	const day = String(d.getDate()).padStart(2, '0');
	const hours = String(d.getHours()).padStart(2, '0');
	const minutes = String(d.getMinutes()).padStart(2, '0');
	return `${year}-${month}-${day} ${hours}:${minutes}`;
}

export function formatRelativeTime(date: Date | string | null | undefined): string {
	const d = ensureDate(date);
	if (!d) return '-';
	const now = new Date();
	const diffMs = now.getTime() - d.getTime();
	const diffSec = Math.floor(diffMs / 1000);
	const diffMin = Math.floor(diffSec / 60);
	const diffHour = Math.floor(diffMin / 60);
	const diffDay = Math.floor(diffHour / 24);

	if (diffSec < 60) return '刚刚';
	if (diffMin < 60) return `${diffMin}分钟前`;
	if (diffHour < 24) return `${diffHour}小时前`;
	if (diffDay < 7) return `${diffDay}天前`;
	return formatDate(d);
}

export function calculateAge(birthDate: Date | string | null | undefined): number | string {
	if (!birthDate) return '-';
	const birth = typeof birthDate === 'string' ? new Date(birthDate) : birthDate;
	const now = new Date();
	let age = now.getFullYear() - birth.getFullYear();
	const monthDiff = now.getMonth() - birth.getMonth();
	if (monthDiff < 0 || (monthDiff === 0 && now.getDate() < birth.getDate())) {
		age--;
	}
	return age;
}

export function formatGender(gender: 'male' | 'female' | null | undefined): string {
	if (!gender) return '-';
	return gender === 'male' ? '男' : '女';
}

export const elderStatusMap: Record<ElderStatus, { label: string; variant: 'pending' | 'success' | 'muted' }> = {
	pending: { label: '待入住', variant: 'pending' },
	admitted: { label: '已入住', variant: 'success' },
	discharged: { label: '已出院', variant: 'muted' }
};

export const assessmentStatusMap: Record<AssessmentStatus, { label: string; variant: 'pending' | 'info' | 'warning' | 'success' | 'muted' | 'danger' }> = {
	draft: { label: '草稿', variant: 'muted' },
	collecting: { label: '采集中', variant: 'info' },
	evaluating: { label: '评定中', variant: 'warning' },
	approving: { label: '审批中', variant: 'pending' },
	archived: { label: '已归档', variant: 'success' },
	closed: { label: '已关闭', variant: 'muted' }
};

export const incidentStatusMap: Record<IncidentStatus, { label: string; variant: 'danger' | 'warning' | 'pending' | 'success' }> = {
	reported: { label: '已上报', variant: 'danger' },
	supplementing: { label: '补充中', variant: 'warning' },
	confirming: { label: '确认中', variant: 'pending' },
	closed: { label: '已关闭', variant: 'success' }
};

export function formatFileSize(bytes: number | null | undefined): string {
	if (!bytes || bytes <= 0) return '-';
	const units = ['B', 'KB', 'MB', 'GB'];
	let i = 0;
	let size = bytes;
	while (size >= 1024 && i < units.length - 1) {
		size /= 1024;
		i++;
	}
	return `${size.toFixed(size >= 10 || i === 0 ? 0 : 1)} ${units[i]}`;
}

export function formatPercentage(value: number | null | undefined, decimals: number = 1): string {
	if (value === null || value === undefined || isNaN(value)) return '-';
	return `${value.toFixed(decimals)}%`;
}
