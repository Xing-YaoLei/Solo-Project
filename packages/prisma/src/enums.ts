export const TicketTypeStatusLabel: Record<string, string> = {
  DRAFT: '草稿',
  ACTIVE: '在售',
  SUSPENDED: '停售',
  CLOSED: '关闭',
};

export const OrderStatusLabel: Record<string, string> = {
  PENDING: '待支付',
  PAID: '已支付',
  CONFIRMED: '已确认',
  COMPLETED: '已完成',
  CANCELLED: '已取消',
  REFUNDING: '退款中',
  REFUNDED: '已退款',
  DISPUTED: '有争议',
};

export const SeatStatusLabel: Record<string, string> = {
  AVAILABLE: '可用',
  LOCKED: '锁定',
  OCCUPIED: '已售',
  RESERVED: '预留',
  MAINTAINED: '维护中',
};

export const CheckInStatusLabel: Record<string, string> = {
  PENDING: '待核销',
  CHECKED_IN: '已入场',
  CHECKED_OUT: '已离场',
  EXPIRED: '已过期',
  INVALID: '已作废',
};

export const SponsorTypeLabel: Record<string, string> = {
  TITLE_SPONSOR: '冠名赞助商',
  PLATINUM: '铂金赞助商',
  GOLD: '金牌赞助商',
  SILVER: '银牌赞助商',
  BRONZE: '铜牌赞助商',
  OFFICIAL_PARTNER: '官方合作伙伴',
};

export const ExceptionTypeLabel: Record<string, string> = {
  REFUND_DISPUTE: '退票争议',
  DOUBLE_PAYMENT: '重复支付',
  SEAT_CONFLICT: '座位冲突',
  CHECKIN_ABNORMAL: '核销异常',
  SYSTEM_ERROR: '系统错误',
  OTHER: '其他',
};

export const ExceptionStatusLabel: Record<string, string> = {
  OPEN: '待处理',
  INVESTIGATING: '调查中',
  PENDING_RESPONSE: '待反馈',
  RESOLVED: '已解决',
  CLOSED: '已关闭',
  ESCALATED: '已升级',
};

export const LiabilityPartyLabel: Record<string, string> = {
  CUSTOMER: '客户',
  PLATFORM: '平台',
  VENUE: '场馆方',
  ORGANIZER: '主办方',
  THIRD_PARTY: '第三方',
  UNCLEAR: '待确认',
};
