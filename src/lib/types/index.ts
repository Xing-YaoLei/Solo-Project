export type RiskLevel = 'critical' | 'issue' | 'comment' | 'resolved';

export interface DocumentCategory {
	id: string;
	name: string;
	code: string;
	description?: string;
	required: boolean;
	sortOrder: number;
}

export interface MissingDocument {
	id: string;
	code: string;
	name: string;
	description?: string;
	riskLevel: RiskLevel;
	assignedTo?: string;
	dueDate?: string;
}

export interface CompletenessStats {
	completenessRate: number;
	totalRequired: number;
	completedCount: number;
	missingCategories: MissingDocument[];
	trendData: Array<{
		date: string;
		rate: number;
	}>;
}

export const scopeTypeOptions = [
	{ value: 'construction', label: '施工授权' },
	{ value: 'material', label: '材料进场' },
	{ value: 'design_change', label: '设计变更' },
	{ value: 'payment', label: '款项支付' },
	{ value: 'acceptance', label: '阶段验收' },
	{ value: 'warranty', label: '保修服务' },
	{ value: 'other', label: '其他' }
];

export const changeTypeOptions = [
	{ value: 'design', label: '设计变更' },
	{ value: 'material', label: '材料变更' },
	{ value: 'process', label: '工艺变更' },
	{ value: 'schedule', label: '工期变更' },
	{ value: 'cost', label: '费用变更' },
	{ value: 'other', label: '其他' }
];

export const statusColors: Record<string, string> = {
	pending: '#f59e0b',
	approved: '#10b981',
	rejected: '#ef4444',
	returned: '#f97316',
	ongoing: '#3b82f6',
	completed: '#10b981',
	cancelled: '#6b7280'
};

export const riskColors: Record<RiskLevel, string> = {
	critical: '#dc2626',
	issue: '#f59e0b',
	comment: '#3b82f6',
	resolved: '#10b981'
};

export const riskLabels: Record<RiskLevel, string> = {
	critical: '严重',
	issue: '问题',
	comment: '备注',
	resolved: '已解决'
};

export function calculateRiskLevel(
	categoryCode: string,
	daysUntilDeadline: number
): RiskLevel {
	const highRiskCodes = ['contract', 'id_card', 'payment_proof', 'acceptance'];
	const mediumRiskCodes = ['design_draw', 'material_list', 'construction_photo'];

	if (highRiskCodes.includes(categoryCode)) {
		return daysUntilDeadline < 3 ? 'critical' : 'issue';
	}
	if (mediumRiskCodes.includes(categoryCode)) {
		return daysUntilDeadline < 7 ? 'issue' : 'comment';
	}
	return 'comment';
}
