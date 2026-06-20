/**
 * 枚举中文标签映射
 * 开发态入口：由 src/index.js require 加载
 * 构建态入口：由 src/index.ts 导出，经 tsc 编译为 dist/enums.js
 */

exports.TicketTypeStatusLabel = {
  DRAFT: '草稿',
  ACTIVE: '在售',
  SUSPENDED: '停售',
  CLOSED: '关闭',
};

exports.OrderStatusLabel = {
  PENDING: '待支付',
  PAID: '已支付',
  CONFIRMED: '已确认',
  COMPLETED: '已完成',
  CANCELLED: '已取消',
  REFUNDING: '退款中',
  REFUNDED: '已退款',
  DISPUTED: '有争议',
};

exports.SeatStatusLabel = {
  AVAILABLE: '可用',
  LOCKED: '锁定',
  OCCUPIED: '已售',
  RESERVED: '预留',
  MAINTAINED: '维护中',
};

exports.CheckInStatusLabel = {
  PENDING: '待核销',
  CHECKED_IN: '已入场',
  CHECKED_OUT: '已离场',
  EXPIRED: '已过期',
  INVALID: '已作废',
};

exports.SponsorTypeLabel = {
  TITLE_SPONSOR: '冠名赞助商',
  PLATINUM: '铂金赞助商',
  GOLD: '金牌赞助商',
  SILVER: '银牌赞助商',
  BRONZE: '铜牌赞助商',
  OFFICIAL_PARTNER: '官方合作伙伴',
};

exports.ExceptionTypeLabel = {
  REFUND_DISPUTE: '退票争议',
  DOUBLE_PAYMENT: '重复支付',
  SEAT_CONFLICT: '座位冲突',
  CHECKIN_ABNORMAL: '核销异常',
  SYSTEM_ERROR: '系统错误',
  OTHER: '其他',
};

exports.ExceptionStatusLabel = {
  OPEN: '待处理',
  INVESTIGATING: '调查中',
  PENDING_RESPONSE: '待反馈',
  RESOLVED: '已解决',
  CLOSED: '已关闭',
  ESCALATED: '已升级',
};

exports.LiabilityPartyLabel = {
  CUSTOMER: '客户',
  PLATFORM: '平台',
  VENUE: '场馆方',
  ORGANIZER: '主办方',
  THIRD_PARTY: '第三方',
  UNCLEAR: '待确认',
};
