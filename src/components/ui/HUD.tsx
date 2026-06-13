import { motion, AnimatePresence } from 'framer-motion'
import { useGameStore } from '@/stores/useGameStore'
import { useUIStore } from '@/stores/useUIStore'
import { TimerBar } from './TimerBar'
import { ItemBar } from './ItemBar'
import { ScoreBoard } from './ScoreBoard'
import type { GamePhase } from '@/types'

const PHASES: { key: GamePhase; label: string }[] = [
  { key: 'matching', label: '手牌匹配' },
  { key: 'inventory', label: '库存领用' },
  { key: 'event', label: '事件处理' },
  { key: 'settlement', label: '结算' },
]

const PHASE_ORDER: GamePhase[] = ['matching', 'inventory', 'event', 'settlement']

function getPhaseIndex(phase: GamePhase): number {
  const idx = PHASE_ORDER.indexOf(phase)
  return idx === -1 ? 0 : idx
}

export function HUD() {
  const phase = useGameStore((s) => s.phase)
  const timeRemaining = useGameStore((s) => s.timeRemaining)
  const currentLevel = useGameStore((s) => s.currentLevel)
  const isTimerFrozen = useGameStore((s) => s.isTimerFrozen)
  const showEffectPhoto = useUIStore((s) => s.showEffectPhoto)

  const timeLimit = currentLevel?.timeLimit ?? 0
  const isUrgent = timeRemaining <= 10 && timeRemaining > 0 && phase === 'matching'
  const currentIdx = getPhaseIndex(phase)

  return (
    <div className="fixed inset-0 pointer-events-none z-40">
      <div className="absolute top-0 left-0 right-0 pointer-events-auto px-4 pt-3">
        <TimerBar
          timeRemaining={timeRemaining}
          timeLimit={timeLimit}
          isUrgent={isUrgent}
          isFrozen={isTimerFrozen}
        />
      </div>

      <div className="absolute top-10 right-4 pointer-events-auto">
        <ScoreBoard />
      </div>

      <div className="absolute top-10 left-4 pointer-events-auto">
        <div className="flex items-center gap-1">
          {PHASES.map(({ key, label }, idx) => {
            const isActive = key === phase
            const isCompleted = idx < currentIdx
            const isUpcoming = idx > currentIdx

            return (
              <div key={key} className="flex items-center gap-1">
                <div
                  className={`
                    px-2.5 py-1 rounded-full text-xs font-medium transition-all duration-300
                    ${isActive ? 'bg-[#B76E79]/30 border border-[#B76E79] text-[#B76E79]' : ''}
                    ${isCompleted ? 'bg-[#50C878]/20 border border-[#50C878]/60 text-[#50C878]' : ''}
                    ${isUpcoming ? 'bg-[#3E2723]/30 border border-[#3E2723]/50 text-[#FFFFF0]/30' : ''}
                  `}
                >
                  {label}
                </div>
                {idx < PHASES.length - 1 && (
                  <div className={`w-4 h-px ${isCompleted ? 'bg-[#50C878]/60' : 'bg-[#3E2723]/50'}`} />
                )}
              </div>
            )
          })}
        </div>
      </div>

      <div className="absolute bottom-0 left-0 right-0 pointer-events-auto">
        <ItemBar />
      </div>

      <AnimatePresence>
        {showEffectPhoto && (
          <motion.div
            className="absolute inset-0 bg-black/80 z-50 pointer-events-auto"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
          />
        )}
      </AnimatePresence>
    </div>
  )
}
