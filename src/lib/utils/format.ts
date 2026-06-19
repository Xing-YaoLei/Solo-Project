export function formatCurrency(
	amount: number | string | bigint | null | undefined,
	currency = 'CNY'
): string {
	if (amount === null || amount === undefined) return '¥0.00';
	const num = typeof amount === 'bigint' ? Number(amount) : Number(amount);
	if (Number.isNaN(num)) return '¥0.00';
	return new Intl.NumberFormat('zh-CN', {
		style: 'currency',
		currency,
		minimumFractionDigits: 2,
		maximumFractionDigits: 2
	}).format(num);
}

export function formatNumber(num: number | string | null | undefined, digits = 2): string {
	if (num === null || num === undefined) return '0';
	const n = Number(num);
	if (Number.isNaN(n)) return '0';
	return new Intl.NumberFormat('zh-CN', {
		minimumFractionDigits: digits,
		maximumFractionDigits: digits
	}).format(n);
}

export function formatInteger(num: number | string | null | undefined): string {
	if (num === null || num === undefined) return '0';
	const n = Number(num);
	if (Number.isNaN(n)) return '0';
	return new Intl.NumberFormat('zh-CN').format(Math.round(n));
}

export function formatDate(date: Date | string | null | undefined): string {
	if (!date) return '-';
	const d = typeof date === 'string' ? new Date(date) : date;
	if (Number.isNaN(d.getTime())) return '-';
	return d.toLocaleDateString('zh-CN', {
		year: 'numeric',
		month: '2-digit',
		day: '2-digit'
	});
}

export function formatDateTime(date: Date | string | null | undefined): string {
	if (!date) return '-';
	const d = typeof date === 'string' ? new Date(date) : date;
	if (Number.isNaN(d.getTime())) return '-';
	return d.toLocaleString('zh-CN', {
		year: 'numeric',
		month: '2-digit',
		day: '2-digit',
		hour: '2-digit',
		minute: '2-digit'
	});
}

export function formatTime(date: Date | string | null | undefined): string {
	if (!date) return '-';
	const d = typeof date === 'string' ? new Date(date) : date;
	if (Number.isNaN(d.getTime())) return '-';
	return d.toLocaleTimeString('zh-CN', {
		hour: '2-digit',
		minute: '2-digit'
	});
}

export function formatRelativeTime(date: Date | string | null | undefined): string {
	if (!date) return '-';
	const d = typeof date === 'string' ? new Date(date) : date;
	if (Number.isNaN(d.getTime())) return '-';
	const diff = Date.now() - d.getTime();
	const seconds = Math.floor(diff / 1000);
	const minutes = Math.floor(seconds / 60);
	const hours = Math.floor(minutes / 60);
	const days = Math.floor(hours / 24);

	if (seconds < 60) return '刚刚';
	if (minutes < 60) return `${minutes}分钟前`;
	if (hours < 24) return `${hours}小时前`;
	if (days < 7) return `${days}天前`;
	return formatDate(d);
}

export function formatFileSize(bytes: number | bigint | null | undefined): string {
	if (bytes === null || bytes === undefined) return '0 B';
	const b = typeof bytes === 'bigint' ? Number(bytes) : bytes;
	if (b === 0) return '0 B';
	if (b < 0) return '0 B';
	const units = ['B', 'KB', 'MB', 'GB', 'TB'];
	const i = Math.floor(Math.log(b) / Math.log(1024));
	const size = b / Math.pow(1024, i);
	return `${size.toFixed(i > 0 ? 2 : 0)} ${units[i]}`;
}

export function formatPercent(value: number | null | undefined, digits = 1): string {
	if (value === null || value === undefined) return '0%';
	const v = Number(value);
	if (Number.isNaN(v)) return '0%';
	return `${v.toFixed(digits)}%`;
}

export function formatMileage(km: number | null | undefined): string {
	if (km === null || km === undefined) return '0 km';
	const k = Number(km);
	if (Number.isNaN(k)) return '0 km';
	return `${formatInteger(k)} km`;
}

export function formatHours(hours: number | string | null | undefined): string {
	if (hours === null || hours === undefined) return '0 h';
	const h = Number(hours);
	if (Number.isNaN(h)) return '0 h';
	return `${formatNumber(h, 2)} h`;
}

export function formatPhone(phone: string | null | undefined): string {
	if (!phone) return '-';
	const cleaned = phone.replace(/\D/g, '');
	if (cleaned.length === 11) {
		return `${cleaned.slice(0, 3)} ${cleaned.slice(3, 7)} ${cleaned.slice(7)}`;
	}
	return phone;
}

export function formatPlate(plate: string | null | undefined): string {
	if (!plate) return '-';
	return plate.toUpperCase();
}
