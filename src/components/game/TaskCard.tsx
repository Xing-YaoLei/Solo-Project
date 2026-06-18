import { type ReactNode } from 'react'
import { cn } from '@/lib/utils'
import { useSettingsStore } from '@/stores/useSettingsStore'

interface TaskCardProps {
  children: ReactNode
  resolved: boolean
  correct: boolean | null
  className?: string
}

export default function TaskCard({ children, resolved, correct, className }: TaskCardProps) {
  const animationIntensity = useSettingsStore((s) => s.animationIntensity)

  const durationClass =
    animationIntensity === 'low' ? 'duration-100' :
    animationIntensity === 'high' ? 'duration-500' : 'duration-300'

  return (
    <div
      className={cn(
        'rounded-lg border bg-[#2a2a4a] p-4 transition-all',
        durationClass,
        'animate-[slideIn_0.3s_ease-out]',
        !resolved && 'border-[#3a3a5a]',
        resolved && correct === true && 'border-[#22c55e] shadow-[0_0_12px_rgba(34,197,94,0.3)]',
        resolved && correct === false && 'border-[#ef4444] shadow-[0_0_12px_rgba(239,68,68,0.3)]',
        className
      )}
    >
      {children}
    </div>
  )
}
