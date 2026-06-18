import { useEffect, useState } from 'react'

interface TurnoverIndicatorProps {
  days: number
}

export default function TurnoverIndicator({ days }: TurnoverIndicatorProps) {
  const [progress, setProgress] = useState(0)

  const maxDays = 40
  const targetProgress = Math.min(days / maxDays, 1)

  const getColor = () => {
    if (days < 20) return '#22c55e'
    if (days < 30) return '#eab308'
    return '#ef4444'
  }

  useEffect(() => {
    const timer = setTimeout(() => setProgress(targetProgress), 100)
    return () => clearTimeout(timer)
  }, [targetProgress])

  const radius = 70
  const strokeWidth = 10
  const circumference = 2 * Math.PI * radius
  const offset = circumference - progress * circumference

  return (
    <div className="flex flex-col items-center gap-2">
      <svg width="180" height="180" viewBox="0 0 180 180">
        <circle
          cx="90"
          cy="90"
          r={radius}
          fill="none"
          stroke="#3a3a5a"
          strokeWidth={strokeWidth}
        />
        <circle
          cx="90"
          cy="90"
          r={radius}
          fill="none"
          stroke={getColor()}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          transform="rotate(-90 90 90)"
          style={{ transition: 'stroke-dashoffset 1s ease-out' }}
        />
        <text
          x="90"
          y="80"
          textAnchor="middle"
          dominantBaseline="middle"
          fill="#f5f0e8"
          fontSize="36"
          fontWeight="700"
          fontFamily="'Noto Sans SC', sans-serif"
        >
          {days}
        </text>
        <text
          x="90"
          y="110"
          textAnchor="middle"
          dominantBaseline="middle"
          fill="#f5f0e880"
          fontSize="16"
          fontFamily="'Noto Sans SC', sans-serif"
        >
          天
        </text>
      </svg>
      <span className="text-sm text-[#f5f0e880]">库存周转天数</span>
    </div>
  )
}
