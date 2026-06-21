import type { DocumentStatus } from '../types'
import { STATUS_LABELS, STATUS_COLORS } from '../types'

interface Props {
  status: DocumentStatus
  rejectionCount?: number
}

export default function StatusBadge({ status, rejectionCount = 0 }: Props) {
  const isRejected = status === 'rejected' || rejectionCount > 0

  return (
    <span
      className={isRejected ? 'badge rejected-badge' : 'badge'}
      style={
        !isRejected
          ? { background: STATUS_COLORS[status] + '20', color: STATUS_COLORS[status] }
          : undefined
      }
    >
      {STATUS_LABELS[status]}
      {rejectionCount > 0 && !isRejected ? ` (退${rejectionCount})` : ''}
      {isRejected && rejectionCount > 0 ? ` ×${rejectionCount}` : ''}
    </span>
  )
}
