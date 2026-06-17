import { clsx } from 'clsx'

const levelConfig: Record<string, { bg: string; label: string }> = {
  LEVEL_1: { bg: 'bg-green-100 text-green-700', label: '一级护理' },
  LEVEL_2: { bg: 'bg-teal-100 text-teal-700', label: '二级护理' },
  LEVEL_3: { bg: 'bg-yellow-100 text-yellow-700', label: '三级护理' },
  LEVEL_4: { bg: 'bg-orange-100 text-orange-700', label: '四级护理' },
  LEVEL_5: { bg: 'bg-red-100 text-red-700', label: '五级护理' },
}

interface CareLevelBadgeProps {
  level: string
}

export default function CareLevelBadge({ level }: CareLevelBadgeProps) {
  const config = levelConfig[level] ?? { bg: 'bg-slate-100 text-slate-600', label: level }

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.bg}`}
    >
      {config.label}
    </span>
  )
}
