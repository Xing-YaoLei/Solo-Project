import { useEffect, useState } from 'react'
import { Timer, Route, Send, ArrowRight } from 'lucide-react'
import { useGameStore } from '@/store/gameStore'
import { guideRoutes } from '@/data/gameData'
import type { GamePhase } from '@/types'

const PHASE_LABEL: Record<GamePhase, string> = {
  idle: '准备开始',
  observing: '观察阶段',
  'route-select': '路线选择',
  'seat-assign': '座位分配',
  feedback: '反馈结算',
  complete: '游戏结束',
}

export default function GameHUD() {
  const phase = useGameStore((s) => s.phase)
  const selectedRouteId = useGameStore((s) => s.selectedRouteId)
  const roundStartTime = useGameStore((s) => s.roundStartTime)
  const submitDecision = useGameStore((s) => s.submitDecision)
  const setPhase = useGameStore((s) => s.setPhase)

  const [elapsed, setElapsed] = useState(0)

  useEffect(() => {
    if (phase === 'idle' || phase === 'feedback' || phase === 'complete') return
    const timer = setInterval(() => {
      setElapsed(Math.floor((Date.now() - roundStartTime) / 1000))
    }, 1000)
    return () => clearInterval(timer)
  }, [phase, roundStartTime])

  const minutes = Math.floor(elapsed / 60)
  const seconds = elapsed % 60
  const selectedRoute = guideRoutes.find((r) => r.id === selectedRouteId)

  const handleProceedToSeat = () => {
    if (selectedRouteId) {
      setPhase('seat-assign')
    }
  }

  return (
    <>
      <div className="glass-panel fixed top-0 left-0 right-0 z-30 flex items-center justify-between px-6 py-2.5">
        <div className="flex items-center gap-4">
          <span className="text-xs font-display text-slate-400">阶段</span>
          <span className="text-sm font-display font-semibold text-vivid-orange">
            {PHASE_LABEL[phase]}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <Timer size={14} className="text-slate-400" />
          <span className="font-mono text-sm text-white">
            {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
          </span>
        </div>

        <div className="flex items-center gap-4">
          <span className="text-xs font-display text-slate-400">路线</span>
          <span className="flex items-center gap-1 text-sm font-display text-white">
            <Route size={14} className="text-vivid-orange" />
            {selectedRoute ? selectedRoute.name : '未选择'}
          </span>
        </div>
      </div>

      {phase === 'route-select' && (
        <div className="glass-panel fixed bottom-0 left-0 right-0 z-30 flex items-center justify-center px-6 py-3">
          <button
            onClick={handleProceedToSeat}
            disabled={!selectedRouteId}
            className="flex items-center gap-2 px-8 py-2.5 rounded-xl font-display font-semibold text-sm transition disabled:opacity-40 disabled:cursor-not-allowed bg-gradient-to-r from-vivid-orange to-golden text-white hover:shadow-lg hover:shadow-vivid-orange/30 active:scale-[0.98]"
          >
            <ArrowRight size={14} />
            {selectedRouteId ? '确认路线，前往分配座位' : '请先选择一条路线'}
          </button>
        </div>
      )}

      {phase === 'seat-assign' && (
        <div className="glass-panel fixed bottom-0 left-0 right-0 z-30 flex items-center justify-center px-6 py-3">
          <button
            onClick={submitDecision}
            disabled={!selectedRouteId}
            className="flex items-center gap-2 px-8 py-2.5 rounded-xl font-display font-semibold text-sm transition disabled:opacity-40 disabled:cursor-not-allowed bg-vivid-orange text-white hover:bg-vivid-orange/80"
          >
            <Send size={14} />
            提交决策
          </button>
        </div>
      )}
    </>
  )
}
