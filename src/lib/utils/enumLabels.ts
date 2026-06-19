import type {
	WoStatus,
	ExceptionStatus,
	ExceptionType,
	QuoteStatus,
	UserRole,
	WoItemStatus,
	MovementType,
	ReminderStatus,
	AttachmentCategory
} from '$lib/server/db/schema';

export const woStatusLabels: Record<WoStatus, string> = {
	PENDING: '待确认',
	CONFIRMED: '已确认',
	IN_PROGRESS: '施工中',
	INSPECTION: '质检中',
	COMPLETED: '已完成',
	CANCELLED: '已取消'
};

export const woStatusColors: Record<WoStatus, string> = {
	PENDING: 'warning',
	CONFIRMED: 'primary',
	IN_PROGRESS: 'accent',
	INSPECTION: 'warning',
	COMPLETED: 'success',
	CANCELLED: 'danger'
};

export const exceptionStatusLabels: Record<ExceptionStatus, string> = {
	PENDING: '待处理',
	PROCESSING: '处理中',
	REVIEWING: '审核中',
	CLOSED: '已关闭'
};

export const exceptionStatusColors: Record<ExceptionStatus, string> = {
	PENDING: 'warning',
	PROCESSING: 'primary',
	REVIEWING: 'accent',
	CLOSED: 'success'
};

export const exceptionTypeLabels: Record<ExceptionType, string> = {
	PARTS_SHORTAGE: '配件短缺',
	REWORK: '返工异常',
	CUSTOMER_COMPLAINT: '客户投诉',
	OTHER: '其他异常'
};

export const exceptionTypeColors: Record<ExceptionType, string> = {
	PARTS_SHORTAGE: 'warning',
	REWORK: 'danger',
	CUSTOMER_COMPLAINT: 'accent',
	OTHER: 'secondary'
};

export const roleLabels: Record<UserRole, string> = {
	ADVISOR: '服务顾问',
	TECHNICIAN: '技师',
	PARTS: '配件员',
	MANAGER: '店长'
};

export const quoteStatusLabels: Record<QuoteStatus, string> = {
	DRAFT: '草稿',
	PENDING_CONFIRM: '待确认',
	CONFIRMED: '已确认',
	VOID: '已作废'
};

export const quoteStatusColors: Record<QuoteStatus, string> = {
	DRAFT: 'secondary',
	PENDING_CONFIRM: 'warning',
	CONFIRMED: 'success',
	VOID: 'danger'
};

export const woItemStatusLabels: Record<WoItemStatus, string> = {
	TODO: '待施工',
	DOING: '施工中',
	DONE: '已完成'
};

export const woItemStatusColors: Record<WoItemStatus, string> = {
	TODO: 'secondary',
	DOING: 'accent',
	DONE: 'success'
};

export const movementTypeLabels: Record<MovementType, string> = {
	IN: '入库',
	OUT: '出库',
	ADJUST: '调整'
};

export const movementTypeColors: Record<MovementType, string> = {
	IN: 'success',
	OUT: 'accent',
	ADJUST: 'warning'
};

export const reminderStatusLabels: Record<ReminderStatus, string> = {
	PENDING: '待联系',
	CONTACTED: '已联系',
	ARRANGED: '已安排',
	CANCELLED: '已取消'
};

export const reminderStatusColors: Record<ReminderStatus, string> = {
	PENDING: 'warning',
	CONTACTED: 'primary',
	ARRANGED: 'success',
	CANCELLED: 'danger'
};

export const attachmentCategoryLabels: Record<AttachmentCategory, string> = {
	INSPECTION: '质检单',
	CONSTRUCTION: '施工单',
	EXCEPTION: '异常单',
	OTHER: '其他'
};

export function getWoStatusLabel(status: WoStatus): string {
	return woStatusLabels[status] ?? status;
}

export function getExceptionStatusLabel(status: ExceptionStatus): string {
	return exceptionStatusLabels[status] ?? status;
}

export function getExceptionTypeLabel(type: ExceptionType): string {
	return exceptionTypeLabels[type] ?? type;
}

export function getRoleLabel(role: UserRole): string {
	return roleLabels[role] ?? role;
}

export function getQuoteStatusLabel(status: QuoteStatus): string {
	return quoteStatusLabels[status] ?? status;
}
