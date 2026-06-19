export type UserRole = 'admin' | 'manager' | 'staff';

export type RoomStatusType = 'available' | 'booked' | 'occupied' | 'cleaning' | 'maintenance' | 'blocked';

export type ChannelTypeType = 'airbnb' | 'booking' | 'tujia' | 'meituan' | 'xiaohongshu' | 'direct' | 'other';

export type OrderStatusType = 'pending' | 'confirmed' | 'checked_in' | 'checked_out' | 'cancelled' | 'no_show';

export type CleaningStatusType = 'pending' | 'in_progress' | 'completed' | 'cancelled' | 'rejected';

export type CleaningPriorityType = 'low' | 'medium' | 'high' | 'urgent';

export type IDTypeType = 'id_card' | 'passport' | 'driver_license' | 'other';

export type DepositStatusType = 'collected' | 'frozen' | 'refunded' | 'partial_refunded' | 'deducted';

export type ExceptionTypeType = 'status_conflict' | 'double_booking' | 'overbooking' | 'cleaning_delay' | 'amenity_issue' | 'guest_complaint' | 'other';

export type ExceptionStatusType = 'open' | 'investigating' | 'resolved' | 'closed';

export const ROOM_STATUS_LABELS: Record<RoomStatusType, string> = {
	available: '可预订',
	booked: '已预订',
	occupied: '在住',
	cleaning: '保洁中',
	maintenance: '维修中',
	blocked: '关闭'
};

export const CHANNEL_LABELS: Record<ChannelTypeType, string> = {
	airbnb: 'Airbnb',
	booking: 'Booking.com',
	tujia: '途家',
	meituan: '美团',
	xiaohongshu: '小红书',
	direct: '直订',
	other: '其他'
};

export const ORDER_STATUS_LABELS: Record<OrderStatusType, string> = {
	pending: '待确认',
	confirmed: '已确认',
	checked_in: '已入住',
	checked_out: '已退房',
	cancelled: '已取消',
	no_show: '未到店'
};

export const CLEANING_STATUS_LABELS: Record<CleaningStatusType, string> = {
	pending: '待处理',
	in_progress: '进行中',
	completed: '已完成',
	cancelled: '已取消',
	rejected: '已驳回'
};

export const DEPOSIT_STATUS_LABELS: Record<DepositStatusType, string> = {
	collected: '已收取',
	frozen: '已冻结',
	refunded: '已退还',
	partial_refunded: '部分退还',
	deducted: '已扣除'
};

export const EXCEPTION_STATUS_LABELS: Record<ExceptionStatusType, string> = {
	open: '待处理',
	investigating: '调查中',
	resolved: '已解决',
	closed: '已关闭'
};

export const EXCEPTION_TYPE_LABELS: Record<ExceptionTypeType, string> = {
	status_conflict: '房态冲突',
	double_booking: '重复预订',
	overbooking: '超售',
	cleaning_delay: '保洁延误',
	amenity_issue: '设施问题',
	guest_complaint: '客诉',
	other: '其他'
};

export interface OccupancyRateResult {
	period: string;
	totalRoomNights: number;
	occupiedRoomNights: number;
	occupancyRate: number;
	averageDailyRate: number;
	revenue: number;
	details: {
		date: Date;
		propertyId: string;
		propertyName: string;
		status: RoomStatusType;
		price: number | null;
	}[];
}

export interface DownloadMeta {
	generatedAt: Date;
	generatedBy: string;
	dataRange: {
		startDate: Date;
		endDate: Date;
	};
	metrics: {
		name: string;
		definition: string;
		calculation: string;
	}[];
	filters: Record<string, unknown>;
	notes: string;
}
