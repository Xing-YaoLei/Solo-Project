export const formatCurrency = (value: number, currency: string = 'CNY'): string => {
  const symbols: Record<string, string> = {
    CNY: '¥',
    USD: '$',
    EUR: '€',
    GBP: '£',
  }
  const symbol = symbols[currency] || '¥'
  return `${symbol}${Number(value).toLocaleString('zh-CN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`
}

export const formatDate = (date: string | Date | undefined, format: string = 'YYYY-MM-DD'): string => {
  if (!date) return '-'
  const d = typeof date === 'string' ? new Date(date) : date
  if (isNaN(d.getTime())) return '-'

  const pad = (n: number) => n.toString().padStart(2, '0')
  const year = d.getFullYear()
  const month = pad(d.getMonth() + 1)
  const day = pad(d.getDate())
  const hours = pad(d.getHours())
  const minutes = pad(d.getMinutes())

  return format
    .replace('YYYY', String(year))
    .replace('MM', month)
    .replace('DD', day)
    .replace('HH', hours)
    .replace('mm', minutes)
}

export const formatDateTime = (date: string | Date | undefined): string => {
  return formatDate(date, 'YYYY-MM-DD HH:mm')
}

export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

export const quoteStatusOptions: Array<{ value: string; label: string; color: string }> = [
  { value: 'draft', label: '草稿', color: 'default' },
  { value: 'pending_review', label: '待审核', color: 'processing' },
  { value: 'approving', label: '审批中', color: 'processing' },
  { value: 'approved', label: '已批准', color: 'success' },
  { value: 'rejected', label: '已驳回', color: 'error' },
  { value: 'sent', label: '已发送', color: 'blue' },
  { value: 'confirmed', label: '已确认', color: 'cyan' },
  { value: 'in_payment', label: '付款中', color: 'gold' },
  { value: 'partially_paid', label: '部分付款', color: 'orange' },
  { value: 'paid', label: '已付款', color: 'success' },
  { value: 'closed', label: '已关闭', color: 'default' },
  { value: 'exception', label: '异常', color: 'error' },
]

export const getQuoteStatusLabel = (status: string): string => {
  return quoteStatusOptions.find((s) => s.value === status)?.label || status
}

export const approvalStatusOptions: Array<{ value: string; label: string; color: string }> = [
  { value: 'pending', label: '待审批', color: 'processing' },
  { value: 'approved', label: '已通过', color: 'success' },
  { value: 'rejected', label: '已驳回', color: 'error' },
  { value: 'skipped', label: '已跳过', color: 'default' },
]

export const getApprovalStatusLabel = (status: string): string => {
  return approvalStatusOptions.find((s) => s.value === status)?.label || status
}

export const paymentStatusOptions: Array<{ value: string; label: string; color: string }> = [
  { value: 'pending', label: '待确认', color: 'processing' },
  { value: 'confirmed', label: '已确认', color: 'success' },
  { value: 'failed', label: '失败', color: 'error' },
  { value: 'refunded', label: '已退款', color: 'warning' },
]

export const getPaymentStatusLabel = (status: string): string => {
  return paymentStatusOptions.find((s) => s.value === status)?.label || status
}

export const exceptionStatusOptions: Array<{ value: string; label: string; color: string }> = [
  { value: 'open', label: '待处理', color: 'error' },
  { value: 'investigating', label: '调查中', color: 'processing' },
  { value: 'resolving', label: '处理中', color: 'warning' },
  { value: 'resolved', label: '已解决', color: 'success' },
  { value: 'closed', label: '已关闭', color: 'default' },
]

export const getExceptionStatusLabel = (status: string): string => {
  return exceptionStatusOptions.find((s) => s.value === status)?.label || status
}

export const exceptionTypeOptions: Array<{ value: string; label: string }> = [
  { value: 'amount_mismatch', label: '金额不一致' },
  { value: 'approval_abnormal', label: '审批异常' },
  { value: 'payment_delay', label: '付款延迟' },
  { value: 'document_missing', label: '单据缺失' },
  { value: 'client_dispute', label: '客户争议' },
  { value: 'other', label: '其他' },
]

export const getExceptionTypeLabel = (type: string): string => {
  return exceptionTypeOptions.find((t) => t.value === type)?.label || type
}

export const feeTypeOptions: Array<{ value: string; label: string }> = [
  { value: 'consulting', label: '咨询费' },
  { value: 'litigation', label: '诉讼代理费' },
  { value: 'non_litigation', label: '非诉业务费' },
  { value: 'retainer', label: '常年顾问费' },
  { value: 'travel', label: '差旅费' },
  { value: 'document', label: '文书费' },
  { value: 'notary', label: '公证费' },
  { value: 'other', label: '其他' },
]

export const getFeeTypeLabel = (type: string): string => {
  return feeTypeOptions.find((t) => t.value === type)?.label || type
}

export const paymentMethodOptions: Array<{ value: string; label: string }> = [
  { value: 'bank_transfer', label: '银行转账' },
  { value: 'alipay', label: '支付宝' },
  { value: 'wechat', label: '微信支付' },
  { value: 'cash', label: '现金' },
  { value: 'check', label: '支票' },
  { value: 'other', label: '其他' },
]

export const getPaymentMethodLabel = (method: string): string => {
  return paymentMethodOptions.find((m) => m.value === method)?.label || method
}

export const userRoleOptions: Array<{ value: string; label: string }> = [
  { value: 'lawyer', label: '律师' },
  { value: 'assistant', label: '助理' },
  { value: 'partner', label: '合伙人' },
  { value: 'client', label: '客户' },
]

export const getUserRoleLabel = (role: string): string => {
  return userRoleOptions.find((r) => r.value === role)?.label || role
}

export const attachmentCategoryOptions: Array<{ value: string; label: string }> = [
  { value: 'contract', label: '合同' },
  { value: 'invoice', label: '发票' },
  { value: 'receipt', label: '收据' },
  { value: 'poa', label: '授权委托书' },
  { value: 'court_document', label: '法院文书' },
  { value: 'evidence', label: '证据材料' },
  { value: 'other', label: '其他' },
]

export const getAttachmentCategoryLabel = (category: string): string => {
  return attachmentCategoryOptions.find((c) => c.value === category)?.label || category
}
