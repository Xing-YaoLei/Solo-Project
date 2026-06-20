import { motion, AnimatePresence } from 'motion/react'
import { Users, Clock, TrendingUp } from 'lucide-react'
import type { HeatPoint } from '@/types'
import { HEAT_COLORS } from '@/data/gameData'

interface HeatPointCardProps {
  heatPoint: HeatPoint | null
  visible: boolean
  x: number
  y: number
}

const HEAT_LABEL: Record<HeatPoint['heatLevel'], string> = {
  low: '低',
  medium: '中',
  high: '高',
  critical: '极高',
}

export default function HeatPointCard({ heatPoint, visible, x, y }: HeatPointCardProps) {
  if (!heatPoint) return null

  const color = HEAT_COLORS[heatPoint.heatLevel]

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, scale: 0.85, y: 8 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.85, y: 8 }}
          transition={{ duration: 0.2 }}
          className="glass-card fixed z-50 rounded-xl px-4 py-3 pointer-events-none"
          style={{ left: x, top: y, transform: 'translate(-50%, -120%)' }}
        >
          <div className="flex items-center gap-2 mb-2">
            <span
              className="w-2.5 h-2.5 rounded-full animate-pulse-glow"
              style={{ backgroundColor: color, boxShadow: `0 0 8px ${color}` }}
            />
            <span className="text-sm font-display font-semibold text-white">
              {heatPoint.name}
            </span>
            <span
              className="text-[10px] font-mono px-1.5 py-0.5 rounded-full"
              style={{ backgroundColor: `${color}22`, color }}
            >
              {HEAT_LABEL[heatPoint.heatLevel]}
            </span>
          </div>

          <div className="grid grid-cols-3 gap-3 text-xs">
            <div className="flex items-center gap-1 text-slate-300">
              <Users size={12} className="text-slate-400" />
              <span className="font-mono text-white">{heatPoint.visitorCount}</span>
            </div>
            <div className="flex items-center gap-1 text-slate-300">
              <Clock size={12} className="text-slate-400" />
              <span className="font-mono text-white">{heatPoint.waitTime}min</span>
            </div>
            <div className="flex items-center gap-1 text-slate-300">
              <TrendingUp size={12} className="text-slate-400" />
              <span className="font-mono text-golden">
                {(heatPoint.secondarySpendPotential * 100).toFixed(0)}%
              </span>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
