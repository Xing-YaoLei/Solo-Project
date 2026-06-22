import { clsx, type ClassValue } from "clsx"
import { format, formatDistanceToNow } from "date-fns"
import { nanoid } from "nanoid"
import type { TicketStatus, ReviewOpinion, ClosureReason, UserRole, RemarkPriority } from "./types"
import {
  TICKET_STATUS_COLORS,
  REVIEW_OPINION_COLORS,
  CLOSURE_REASON_COLORS,
  REMARK_PRIORITY_COLORS,
  USER_ROLE_LABELS,
} from "./constants"

export function cn(...inputs: ClassValue[]) {
  return clsx(inputs)
}

export function formatDate(date: string | Date, pattern = "yyyy-MM-dd"): string {
  return format(new Date(date), pattern)
}

export function formatRelativeDate(date: string | Date): string {
  return formatDistanceToNow(new Date(date), { addSuffix: true })
}

export function getStatusColor(
  status: TicketStatus | ReviewOpinion | ClosureReason | RemarkPriority
): string {
  if (status in TICKET_STATUS_COLORS) {
    return TICKET_STATUS_COLORS[status as TicketStatus]
  }
  if (status in REVIEW_OPINION_COLORS) {
    return REVIEW_OPINION_COLORS[status as ReviewOpinion]
  }
  if (status in CLOSURE_REASON_COLORS) {
    return CLOSURE_REASON_COLORS[status as ClosureReason]
  }
  if (status in REMARK_PRIORITY_COLORS) {
    return REMARK_PRIORITY_COLORS[status as RemarkPriority]
  }
  return "#64748B"
}

export function getRoleLabel(role: UserRole): string {
  return USER_ROLE_LABELS[role]
}

export function maskSensitiveData(value: string, visibleChars = 4): string {
  if (value.length <= visibleChars) return "****"
  const visible = value.slice(0, visibleChars)
  return `${visible}${"*".repeat(Math.min(value.length - visibleChars, 8))}`
}

export function generateShareToken(): string {
  return nanoid(32)
}
