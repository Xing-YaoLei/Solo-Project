import { useGameStore } from '@/stores/useGameStore'
import { levels } from '@/data/levels'
import { cn } from '@/lib/utils'

export default function CountdownBar() {
  const timeRemaining = useGameStore((s) => s.timeRemaining)
  const currentLevel = useGameStore((s) => s.currentLevel)
  const isPlaying = useGameStore((s) => s.isPlaying)
  const isPaused = useGameStore((s) => s.isPaused)

  const level = levels.find((l) => l.id === currentLevel)
  const totalTime = level?.timeLimit ?? 90
  const pct = totalTime > 0 ? (timeRemaining / totalTime) * 100 : 0

  const barColor =
    pct > 50 ? 'bg-[#22c55e]' :
    pct > 25 ? 'bg-[#eab308]' :
    'bg-[#ef4444]'

  const isUrgent = timeRemaining < 10 && isPlaying && !isPaused

  return (
    <div className="relative w-full h-8 bg-[#2a2a4a] rounded-full overflow-hidden">
      <div
        className={cn(
          'h-full rounded-full transition-all duration-1000 ease-linear',
          barColor,
          isUrgent && 'animate-pulse'
        )}
        style={{ width: `${pct}%` }}
      />
      <span
        className={cn(
          'absolute inset-0 flex items-center justify-center text-sm font-bold tabular-nums',
          'text-[#f5f0e8] drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]',
          isUrgent && 'animate-pulse'
        )}
      >
        {timeRemaining}s
      </span>
    </div>
  )
}
