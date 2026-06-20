import type { VerificationStatus } from '../types'
import { getStatusLabel, getStatusColor } from '../lib/utils'

interface StatusBadgeProps {
  status: VerificationStatus
  className?: string
}

export default function StatusBadge({ status, className }: StatusBadgeProps) {
  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(status)} ${className || ''}`}
    >
      {getStatusLabel(status)}
    </span>
  )
}
