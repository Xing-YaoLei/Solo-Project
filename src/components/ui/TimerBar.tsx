import { motion } from 'framer-motion'
import { Snowflake } from 'lucide-react'

interface TimerBarProps {
  timeRemaining: number
  timeLimit: number
  isUrgent: boolean
  isFrozen: boolean
}

function getGradient(progress: number): string {
  if (progress > 0.5) return 'from-[#50C878] to-[#50C878]'
  if (progress > 0.25) return 'from-[#50C878] via-[#FFBF00] to-[#FFBF00]'
  return 'from-[#FFBF00] to-red-500'
}

export function TimerBar({ timeRemaining, timeLimit, isUrgent, isFrozen }: TimerBarProps) {
  const progress = timeLimit > 0 ? timeRemaining / timeLimit : 0
  const percent = Math.max(0, Math.min(100, progress * 100))

  return (
    <div className="relative w-full h-2 bg-[#3E2723]/60 rounded-full overflow-visible">
      <motion.div
        className={`h-full rounded-full bg-gradient-to-r ${getGradient(progress)}`}
        initial={{ width: '100%' }}
        animate={{
          width: `${percent}%`,
          scale: isUrgent ? 1.02 : 1,
        }}
        transition={{ duration: 0.5, ease: 'linear' }}
        style={isUrgent ? { boxShadow: '0 0 12px 2px rgba(255,191,0,0.6)' } : undefined}
      />

      {isFrozen && (
        <div className="absolute inset-0 flex items-center justify-center bg-blue-500/30 rounded-full">
          <Snowflake className="w-3 h-3 text-blue-300 animate-pulse" />
        </div>
      )}

      {isUrgent && (
        <motion.div
          className="absolute inset-0 rounded-full"
          animate={{ opacity: [0.3, 0.7, 0.3] }}
          transition={{ duration: 1, repeat: Infinity }}
          style={{ boxShadow: '0 0 8px 4px rgba(255,80,80,0.4)' }}
        />
      )}

      <span className="absolute -right-10 top-1/2 -translate-y-1/2 text-xs font-mono text-[#FFFFF0]/80">
        {Math.ceil(timeRemaining)}s
      </span>
    </div>
  )
}
