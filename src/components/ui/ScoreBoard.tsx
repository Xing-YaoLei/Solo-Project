import { motion, AnimatePresence } from 'framer-motion'
import { useGameStore } from '@/stores/useGameStore'

function AnimatedNumber({ value, className }: { value: number; className?: string }) {
  return (
    <AnimatePresence mode="popLayout">
      <motion.span
        key={value}
        className={className}
        initial={{ y: -8, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 8, opacity: 0 }}
        transition={{ duration: 0.2 }}
      >
        {value}
      </motion.span>
    </AnimatePresence>
  )
}

export function ScoreBoard() {
  const score = useGameStore((s) => s.score)
  const matchedCount = useGameStore((s) => s.matchedCount)
  const wrongCount = useGameStore((s) => s.wrongCount)

  return (
    <div className="flex flex-col gap-2 px-4 py-3 rounded-xl bg-[#1a0f0a]/80 backdrop-blur-sm border border-[#3E2723]/50 shadow-lg min-w-[120px]">
      <div className="flex items-center justify-between gap-3">
        <span className="text-xs text-[#FFFFF0]/60">得分</span>
        <AnimatedNumber value={score} className="text-base font-bold text-[#B76E79]" />
      </div>

      <div className="flex items-center justify-between gap-3">
        <span className="text-xs text-[#FFFFF0]/60">匹配</span>
        <AnimatedNumber value={matchedCount} className="text-base font-bold text-[#50C878]" />
      </div>

      <div className="flex items-center justify-between gap-3">
        <span className="text-xs text-[#FFFFF0]/60">失误</span>
        <AnimatedNumber value={wrongCount} className="text-base font-bold text-red-400" />
      </div>
    </div>
  )
}
