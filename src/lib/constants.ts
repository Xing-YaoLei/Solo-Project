import type { TicketStatus, ReviewOpinion, ClosureReason, UserRole, RemarkPriority, FunnelStageKey, BoardGroupBy } from "./types"

export const TICKET_STATUS_LABELS: Record<TicketStatus, string> = {
  pending_remediation: "待整改",
  in_remediation: "整改中",
  pending_review: "待复核",
  closed: "已关闭",
}

export const REVIEW_OPINION_LABELS: Record<ReviewOpinion, string> = {
  approved: "通过",
  rejected: "不通过",
  returned_for_modification: "退回修改",
}

export const CLOSURE_REASON_LABELS: Record<ClosureReason, string> = {
  remediated: "整改完成",
  risk_accepted: "风险接受",
  no_longer_applicable: "不再适用",
}

export const USER_ROLE_LABELS: Record<UserRole, string> = {
  auditor: "审计员",
  business_owner: "业务负责人",
  compliance_officer: "合规官",
  management: "管理层",
}

export const REMARK_PRIORITY_LABELS: Record<RemarkPriority, string> = {
  high: "高",
  medium: "中",
  low: "低",
}

export const TICKET_STATUS_COLORS: Record<TicketStatus, string> = {
  pending_remediation: "#64748B",
  in_remediation: "#D97706",
  pending_review: "#2563EB",
  closed: "#059669",
}

export const REVIEW_OPINION_COLORS: Record<ReviewOpinion, string> = {
  approved: "#059669",
  rejected: "#E11D48",
  returned_for_modification: "#D97706",
}

export const CLOSURE_REASON_COLORS: Record<ClosureReason, string> = {
  remediated: "#059669",
  risk_accepted: "#D97706",
  no_longer_applicable: "#64748B",
}

export const REMARK_PRIORITY_COLORS: Record<RemarkPriority, string> = {
  high: "#E11D48",
  medium: "#D97706",
  low: "#64748B",
}

export const FUNNEL_STAGES: Array<{ key: FunnelStageKey; label: string; color: string }> = [
  { key: "discovered", label: "审计发现", color: "#1B2A4A" },
  { key: "assigned", label: "整改分配", color: "#2563EB" },
  { key: "remediating", label: "整改执行", color: "#D97706" },
  { key: "reviewing", label: "待复核", color: "#7C3AED" },
  { key: "closed", label: "已关闭", color: "#059669" },
]

export const BOARD_GROUP_BY_OPTIONS: Array<{ value: BoardGroupBy; label: string }> = [
  { value: "review_opinion", label: "复核意见" },
  { value: "closure_reason", label: "关闭原因" },
  { value: "status", label: "工单状态" },
]

export const SHARE_PAGE_OPTIONS = [
  { value: "funnel", label: "漏斗报表" },
  { value: "board", label: "看板" },
  { value: "ticket", label: "工单明细" },
] as const

export const THEME_COLORS = {
  primary: "#1B2A4A",
  accent: "#D97706",
  success: "#059669",
  danger: "#E11D48",
  muted: "#64748B",
} as const
