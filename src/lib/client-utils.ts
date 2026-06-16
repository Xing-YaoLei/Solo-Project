import clsx from 'clsx';
import type { ClassValue } from 'clsx';

export function cn(...inputs: ClassValue[]) {
	return clsx(inputs);
}

export const careLevelMap: Record<string, { label: string; color: string }> = {
	independent: { label: '自理', color: 'bg-green-100 text-green-800' },
	semi_dependent: { label: '半自理', color: 'bg-yellow-100 text-yellow-800' },
	dependent: { label: '不能自理', color: 'bg-orange-100 text-orange-800' },
	total_care: { label: '全护', color: 'bg-red-100 text-red-800' }
};

export const genderMap: Record<string, string> = {
	male: '男',
	female: '女',
	other: '其他'
};

export const roleMap: Record<string, { label: string; color: string }> = {
	admin: { label: '系统管理员', color: 'bg-purple-100 text-purple-800' },
	manager: { label: '管理层', color: 'bg-blue-100 text-blue-800' },
	nurse: { label: '护士', color: 'bg-teal-100 text-teal-800' },
	caregiver: { label: '护理员', color: 'bg-gray-100 text-gray-800' }
};

export const reminderStatusMap: Record<string, { label: string; color: string }> = {
	pending: { label: '待执行', color: 'bg-yellow-100 text-yellow-800' },
	taken: { label: '已服药', color: 'bg-green-100 text-green-800' },
	missed: { label: '漏服', color: 'bg-red-100 text-red-800' },
	skipped: { label: '跳过', color: 'bg-gray-100 text-gray-800' }
};

export const riskEventTypeMap: Record<string, { label: string; color: string }> = {
	fall: { label: '跌倒', color: 'bg-red-100 text-red-800' },
	illness: { label: '疾病', color: 'bg-orange-100 text-orange-800' },
	medication_error: { label: '用药差错', color: 'bg-yellow-100 text-yellow-800' },
	wandering: { label: '走失', color: 'bg-purple-100 text-purple-800' },
	conflict: { label: '冲突', color: 'bg-blue-100 text-blue-800' },
	other: { label: '其他', color: 'bg-gray-100 text-gray-800' }
};

export const riskSeverityMap: Record<string, { label: string; color: string }> = {
	low: { label: '低', color: 'bg-green-100 text-green-800' },
	medium: { label: '中', color: 'bg-yellow-100 text-yellow-800' },
	high: { label: '高', color: 'bg-orange-100 text-orange-800' },
	critical: { label: '危急', color: 'bg-red-100 text-red-800' }
};

export const riskStatusMap: Record<string, { label: string; color: string }> = {
	reported: { label: '已上报', color: 'bg-blue-100 text-blue-800' },
	investigating: { label: '调查中', color: 'bg-yellow-100 text-yellow-800' },
	resolved: { label: '已解决', color: 'bg-green-100 text-green-800' },
	closed: { label: '已关闭', color: 'bg-gray-100 text-gray-800' }
};

export const activityTypeMap: Record<string, { label: string; color: string; icon: string }> = {
	morning_exercise: { label: '晨间锻炼', color: 'bg-green-100 text-green-800', icon: '🏃' },
	recreational: { label: '娱乐活动', color: 'bg-purple-100 text-purple-800', icon: '🎮' },
	meal: { label: '用餐', color: 'bg-yellow-100 text-yellow-800', icon: '🍽️' },
	rest: { label: '休息', color: 'bg-blue-100 text-blue-800', icon: '😴' },
	therapy: { label: '理疗', color: 'bg-teal-100 text-teal-800', icon: '💆' },
	walk: { label: '散步', color: 'bg-indigo-100 text-indigo-800', icon: '🚶' },
	other: { label: '其他', color: 'bg-gray-100 text-gray-800', icon: '📝' }
};

export const communicationTypeMap: Record<string, { label: string; color: string }> = {
	internal_note: { label: '内部备注', color: 'bg-gray-100 text-gray-800' },
	family_call: { label: '家属沟通', color: 'bg-blue-100 text-blue-800' },
	doctor_consult: { label: '医生咨询', color: 'bg-teal-100 text-teal-800' },
	meeting: { label: '会议记录', color: 'bg-purple-100 text-purple-800' }
};
