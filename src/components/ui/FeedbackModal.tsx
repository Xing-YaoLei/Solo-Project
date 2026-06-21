import { motion, AnimatePresence } from 'motion/react'
import { AlertTriangle, RotateCcw, Trophy, TrendingUp, Clock, Play } from 'lucide-react'
import { useGameStore } from '@/store/gameStore'
import type { FeedbackResult } from '@/types'

const GRADE_STYLE: Record<FeedbackResult['overallGrade'], { color: string; glow: string }> = {
  S: { color: '#F5C542', glow: '0 0 24px rgba(245,197,66,0.5)' },
  A: { color: '#FF6B35', glow: '0 0 20px rgba(255,107,53,0.4)' },
  B: { color: '#3b82f6', glow: '0 0 16px rgba(59,130,246,0.3)' },
  C: { color: '#a78bfa', glow: '0 0 12px rgba(167,139,250,0.25)' },
  D: { color: '#6b7280', glow: 'none' },
}

function ScoreRing({ score, grade }: { score: number; grade: FeedbackResult['overallGrade'] }) {
  const radius = 54
  const circumference = 2 * Math.PI * radius
  const offset = circumference - (score / 100) * circumference
  const style = GRADE_STYLE[grade]

  return (
    <div className="relative w-32 h-32 mx-auto mb-3">
      <svg className="w-full h-full -rotate-90" viewBox="0 0 120 120">
        <circle cx="60" cy="60" r={radius} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="8" />
        <motion.circle
          cx="60" cy="60" r={radius} fill="none"
          stroke={style.color} strokeWidth="8" strokeLinecap="round"
          strokeDasharray={circumference}
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1.2, ease: 'easeOut' }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span
          className="text-4xl font-mono font-black"
          style={{ color: style.color, textShadow: style.glow }}
        >
          {grade}
        </span>
        <span className="text-xs font-mono text-slate-400">{score}分</span>
      </div>
    </div>
  )
}

export default function FeedbackModal() {
  const phase = useGameStore((s) => s.phase)
  const feedback = useGameStore((s) => s.feedback)
  const startRound = useGameStore((s) => s.startRound)
  const setShowLeaderboard = useGameStore((s) => s.setShowLeaderboard)
  const setShowReplay = useGameStore((s) => s.setShowReplay)
  const setLeaderboardTab = useGameStore((s) => s.setLeaderboardTab)
  const replays = useGameStore((s) => s.replays)
  const visible = phase === 'feedback' && feedback !== null

  if (!feedback) return null

  const spendPct = Math.round(feedback.secondarySpendRate * 100)
  const satPct = Math.round(feedback.seatSatisfaction * 100)

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
        >
          <motion.div
            initial={{ scale: 0.8, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.8, opacity: 0, y: 20 }}
            transition={{ type: 'spring', damping: 20, stiffness: 180 }}
            className="glass-panel rounded-2xl p-7 w-[440px] max-h-[90vh] overflow-y-auto"
          >
            <ScoreRing score={feedback.score} grade={feedback.overallGrade} />

            <div className="grid grid-cols-2 gap-3 mb-4">
              <div className="glass-card rounded-lg p-3 text-center">
                <Trophy size={16} className="mx-auto text-golden mb-1" />
                <div className="font-mono text-sm text-golden">{spendPct}%</div>
                <div className="text-[10px] text-slate-400">二消转化率</div>
              </div>
              <div className="glass-card rounded-lg p-3 text-center">
                <RotateCcw size={16} className="mx-auto text-vivid-orange mb-1" />
                <div className="font-mono text-sm text-white">{satPct}%</div>
                <div className="text-[10px] text-slate-400">座位满意度</div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 mb-4">
              <button
                onClick={() => {
                  setLeaderboardTab('spend')
                  setShowLeaderboard(true)
                }}
                className="glass-card rounded-xl p-3 text-center hover:bg-golden/10 hover:border-golden/30 transition-all group"
              >
                <div className="flex items-center justify-center gap-1 mb-1">
                  <TrendingUp size={14} className="text-golden" />
                  <span className="text-[11px] font-display font-semibold text-golden">二消榜</span>
                </div>
                <div className="text-[10px] text-slate-400">查看转化排名</div>
              </button>
              <button
                onClick={() => {
                  setLeaderboardTab('time')
                  setShowLeaderboard(true)
                }}
                className="glass-card rounded-xl p-3 text-center hover:bg-emerald-500/10 hover:border-emerald-500/30 transition-all group"
              >
                <div className="flex items-center justify-center gap-1 mb-1">
                  <Clock size={14} className="text-emerald-400" />
                  <span className="text-[11px] font-display font-semibold text-emerald-400">时间榜</span>
                </div>
                <div className="text-[10px] text-slate-400">查看速度排名</div>
              </button>
            </div>

            {replays.length > 0 && (
              <button
                onClick={() => setShowReplay(true)}
                className="w-full glass-card rounded-xl p-3 mb-4 text-center hover:bg-vivid-orange/10 hover:border-vivid-orange/30 transition-all flex items-center justify-center gap-2"
              >
                <Play size={14} className="text-vivid-orange" />
                <div className="text-left">
                  <div className="text-[11px] font-display font-semibold text-vivid-orange">
                    失败回放对比 ({replays.length}/3 条记录)
                  </div>
                  <div className="text-[10px] text-slate-400">
                    查看三次座位失败分配，对比选择差异
                  </div>
                </div>
              </button>
            )}

            {feedback.riskWarnings.length > 0 && (
              <div className="mb-5">
                <div className="flex items-center gap-1 text-xs text-red-400 mb-2">
                  <AlertTriangle size={12} />
                  风险警告
                </div>
                <ul className="space-y-1">
                  {feedback.riskWarnings.map((w, i) => (
                    <li key={i} className="text-xs text-slate-300 pl-3 relative before:content-[''] before:absolute before:left-0 before:top-1.5 before:w-1 before:h-1 before:rounded-full before:bg-red-400">
                      {w}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <button
              onClick={startRound}
              className="w-full py-2.5 rounded-xl bg-gradient-to-r from-vivid-orange to-golden text-white font-display font-semibold text-sm hover:shadow-lg hover:shadow-vivid-orange/30 transition active:scale-[0.98]"
            >
              再来一局
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
