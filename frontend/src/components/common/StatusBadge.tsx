import { getStatusLabel, getStatusColorConfig } from '../../utils/enums'

interface StatusBadgeProps {
  status: string
  type: 'ticket' | 'plagiarism' | 'member_level'
  className?: string
}

export default function StatusBadge({
  status,
  type,
  className = '',
}: StatusBadgeProps) {
  const label = getStatusLabel(status, type)
  const colors = getStatusColorConfig(status, type)

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${colors.bg} ${colors.text} ${colors.border} ${className}`}
    >
      {label}
    </span>
  )
}
