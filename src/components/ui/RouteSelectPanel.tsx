import { motion, AnimatePresence } from 'motion/react'
import { Clock, MapPin, Shield } from 'lucide-react'
import { guideRoutes } from '@/data/gameData'
import { useGameStore } from '@/store/gameStore'
import type { GuideRoute } from '@/types'

const RISK_CONFIG: Record<GuideRoute['riskLevel'], { label: string; color: string; bg: string }> = {
  safe: { label: '安全', color: '#22c55e', bg: 'rgba(34,197,94,0.15)' },
  moderate: { label: '中等', color: '#eab308', bg: 'rgba(234,179,8,0.15)' },
  high: { label: '高风险', color: '#ef4444', bg: 'rgba(239,68,68,0.15)' },
}

export default function RouteSelectPanel() {
  const phase = useGameStore((s) => s.phase)
  const selectedRouteId = useGameStore((s) => s.selectedRouteId)
  const selectRoute = useGameStore((s) => s.selectRoute)
  const visible = phase === 'route-select'

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ x: -320, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          exit={{ x: -320, opacity: 0 }}
          transition={{ type: 'spring', damping: 25, stiffness: 200 }}
          className="glass-panel fixed left-0 top-0 bottom-0 z-40 w-80 overflow-y-auto p-5"
        >
          <h2 className="text-lg font-display font-bold text-white mb-4">
            选择导览路线
          </h2>

          <div className="flex flex-col gap-3">
            {guideRoutes.map((route) => {
              const isSelected = selectedRouteId === route.id
              const risk = RISK_CONFIG[route.riskLevel]
              const spendPct = Math.round(route.secondarySpendRate * 100)

              return (
                <button
                  key={route.id}
                  onClick={() => selectRoute(route.id)}
                  className={`glass-card rounded-xl p-4 text-left transition-all ${
                    isSelected
                      ? 'ring-2 ring-vivid-orange shadow-[0_0_20px_rgba(255,107,53,0.3)]'
                      : 'hover:bg-white/5'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-display font-semibold text-white text-sm">
                      {route.name}
                    </span>
                    <span
                      className="text-[10px] font-mono px-2 py-0.5 rounded-full"
                      style={{ backgroundColor: risk.bg, color: risk.color }}
                    >
                      {risk.label}
                    </span>
                  </div>

                  <div className="flex items-center gap-3 text-xs text-slate-400 mb-2">
                    <span className="flex items-center gap-1">
                      <Clock size={11} />
                      <span className="font-mono">{route.duration}min</span>
                    </span>
                    <span className="flex items-center gap-1">
                      <MapPin size={11} />
                      <span className="font-mono">{route.attractions.length}景点</span>
                    </span>
                  </div>

                  <div className="mt-2">
                    <div className="flex items-center justify-between text-[10px] text-slate-400 mb-1">
                      <span className="flex items-center gap-1">
                        <Shield size={10} />
                        二消转化率
                      </span>
                      <span className="font-mono text-golden">{spendPct}%</span>
                    </div>
                    <div className="h-1.5 rounded-full bg-white/10 overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${spendPct}%` }}
                        transition={{ duration: 0.6, delay: 0.2 }}
                        className="h-full rounded-full bg-gradient-to-r from-vivid-orange to-golden"
                      />
                    </div>
                  </div>
                </button>
              )
            })}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
