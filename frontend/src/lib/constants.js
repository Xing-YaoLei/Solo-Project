export const ORDER_STATUS = {
  pending: { label: '待确认', color: 'bg-amber-100 text-amber-700' },
  confirmed: { label: '已确认', color: 'bg-blue-100 text-blue-700' },
  checked_in: { label: '已入住', color: 'bg-emerald-100 text-emerald-700' },
  checked_out: { label: '已退房', color: 'bg-gray-100 text-gray-700' },
  cancelled: { label: '已取消', color: 'bg-red-100 text-red-700' },
  refunded: { label: '已退款', color: 'bg-red-100 text-red-700' },
}

export const VERIFICATION_STATUS = {
  pending: { label: '待核销', color: 'bg-amber-100 text-amber-700' },
  verified: { label: '已核销', color: 'bg-emerald-100 text-emerald-700' },
  failed: { label: '核销失败', color: 'bg-red-100 text-red-700' },
}

export const DEPOSIT_STATUS = {
  unpaid: { label: '未支付', color: 'bg-red-100 text-red-700' },
  paid: { label: '已支付', color: 'bg-emerald-100 text-emerald-700' },
  refunded: { label: '已退还', color: 'bg-blue-100 text-blue-700' },
  partially_refunded: { label: '部分退还', color: 'bg-amber-100 text-amber-700' },
  forfeited: { label: '已没收', color: 'bg-gray-100 text-gray-700' },
}

export const ANOMALY_STATUS = {
  open: { label: '待处理', color: 'bg-red-100 text-red-700' },
  processing: { label: '处理中', color: 'bg-amber-100 text-amber-700' },
  resolved: { label: '已解决', color: 'bg-emerald-100 text-emerald-700' },
  closed: { label: '已关闭', color: 'bg-gray-100 text-gray-700' },
}

export const ANOMALY_TYPE = {
  oversold: { label: '套餐超卖', color: 'bg-red-500' },
  price_mismatch: { label: '价格异常', color: 'bg-orange-500' },
  inventory_error: { label: '库存错误', color: 'bg-amber-500' },
  verification_failed: { label: '核销失败', color: 'bg-purple-500' },
  deposit_issue: { label: '押金问题', color: 'bg-blue-500' },
}

export const RESPONSIBILITY_OWNER = {
  sales: '销售部',
  operations: '运营部',
  front_desk: '前台',
  system: '系统',
  customer: '客户',
}

export const IMPACT_LEVEL = {
  low: { label: '低', color: 'bg-gray-100 text-gray-700' },
  medium: { label: '中', color: 'bg-amber-100 text-amber-700' },
  high: { label: '高', color: 'bg-orange-100 text-orange-700' },
  critical: { label: '严重', color: 'bg-red-100 text-red-700' },
}

export const RULE_TYPE = {
  weekday: '平日规则',
  weekend: '周末规则',
  holiday: '节假日规则',
  custom_date: '自定义日期规则',
}

export const ADJUSTMENT_TYPE = {
  fixed: '固定金额',
  percentage: '百分比',
}

export const STATUS_FLOW = [
  { key: 'pending', label: '待确认' },
  { key: 'confirmed', label: '已确认' },
  { key: 'checked_in', label: '已入住' },
  { key: 'checked_out', label: '已退房' },
]

export const EXPORT_TYPE = {
  orders: { label: '订单明细', desc: '完整订单列表，含客户、金额、状态' },
  conversion: { label: '套餐转化率', desc: '各套餐确认率、入住率、销售额' },
  inventory: { label: '库存明细', desc: '每日库存、已售、可售及单价' },
  anomaly: { label: '异常单', desc: '异常详情、责任归属与处理结果' },
}
