import { STATUS_LABEL, STATUS_COLOR, ALERT_STATUS_LABEL, ALERT_STATUS_COLOR, SEVERITY_LABEL, SEVERITY_COLOR, DISCREPANCY_TYPE_LABEL, ReplenishmentStatus, TemperatureAlertStatus, DiscrepancyType } from '@/types'
import { classNames } from '@/utils'

export function StatusBadge({ status }: { status: ReplenishmentStatus }) {
  return (
    <span className={classNames('badge', STATUS_COLOR[status])}>
      {STATUS_LABEL[status]}
    </span>
  )
}

export function AlertStatusBadge({ status }: { status: TemperatureAlertStatus }) {
  return (
    <span className={classNames('badge', ALERT_STATUS_COLOR[status])}>
      {ALERT_STATUS_LABEL[status]}
    </span>
  )
}

export function SeverityBadge({ severity }: { severity: string }) {
  return (
    <span className={classNames('badge', SEVERITY_COLOR[severity] || 'bg-slate-100 text-slate-700')}>
      {SEVERITY_LABEL[severity] || severity}
    </span>
  )
}

export function DiscrepancyTypeBadge({ type }: { type: DiscrepancyType }) {
  const colorMap: Record<DiscrepancyType, string> = {
    [DiscrepancyType.QUANTITY_SHORT]: 'bg-orange-100 text-orange-800',
    [DiscrepancyType.QUANTITY_OVER]: 'bg-blue-100 text-blue-800',
    [DiscrepancyType.QUALITY_ISSUE]: 'bg-red-100 text-red-800',
    [DiscrepancyType.WRONG_ITEM]: 'bg-purple-100 text-purple-800',
    [DiscrepancyType.TEMPERATURE_ISSUE]: 'bg-rose-100 text-rose-800',
    [DiscrepancyType.OTHER]: 'bg-slate-100 text-slate-700',
  }
  return (
    <span className={classNames('badge', colorMap[type])}>
      {DISCREPANCY_TYPE_LABEL[type]}
    </span>
  )
}
