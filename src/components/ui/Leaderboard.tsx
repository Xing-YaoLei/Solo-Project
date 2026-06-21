import { motion, AnimatePresence } from 'motion/react'
import { X, Trophy, Clock, TrendingUp, Medal } from 'lucide-react'
import { leaderboardData } from '@/data/gameData'
import { useGameStore } from '@/store/gameStore'
import type { LeaderboardEntry } from '@/types'

function RankBadge({ rank }: { rank: number }) {
  if (rank === 1) {
    return (
      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-yellow-400 to-yellow-600 flex items-center justify-center shadow-lg shadow-yellow-500/30">
        <Medal size={16} className="text-white" />
      </div>
    )
  }
  if (rank === 2) {
    return (
      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-slate-300 to-slate-500 flex items-center justify-center shadow-lg shadow-slate-400/30">
        <span className="text-xs font-black text-white">{rank}</span>
      </div>
    )
  }
  if (rank === 3) {
    return (
      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-amber-600 to-amber-800 flex items-center justify-center shadow-lg shadow-amber-600/30">
        <span className="text-xs font-black text-white">{rank}</span>
      </div>
    )
  }
  return (
    <div className="w-8 h-8 rounded-full bg-white/5 border border-white/10 flex items-center justify-center">
      <span className="text-xs font-mono text-slate-400">{rank}</span>
    </div>
  )
}

function LeaderboardRow({ entry, metric }: { entry: LeaderboardEntry; metric: 'spend' | 'time' }) {
  const isTop3 = entry.rank <= 3

  const displayValue =
    metric === 'spend'
      ? `${Math.round(entry.secondarySpendRate * 100)}%`
      : `${Math.floor(entry.completionTime / 60)}:${String(entry.completionTime % 60).padStart(2, '0')}`

  const barValue =
    metric === 'spend'
      ? entry.secondarySpendRate * 100
      : Math.max(0, 100 - entry.completionTime)

  const barColor =
    metric === 'spend'
      ? 'from-vivid-orange to-golden'
      : 'from-emerald-400 to-cyan-400'

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: entry.rank * 0.04 }}
      className={`glass-card rounded-xl p-3 flex items-center gap-3 ${
        isTop3 ? 'ring-1 ring-white/10' : ''
      }`}
    >
      <RankBadge rank={entry.rank} />

      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-sm font-display font-semibold text-white truncate">
            {entry.playerName}
          </span>
          <span
            className={`text-sm font-mono font-bold ${
              metric === 'spend' ? 'text-golden' : 'text-emerald-400'
            }`}
          >
            {displayValue}
          </span>
        </div>

        <div className="h-1.5 rounded-full bg-white/5 overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${barValue}%` }}
            transition={{ duration: 0.6, delay: 0.2 + entry.rank * 0.04 }}
            className={`h-full rounded-full bg-gradient-to-r ${barColor}`}
          />
        </div>

        <div className="flex items-center justify-between mt-1.5">
          <span className="text-[10px] text-slate-400 font-mono">
            准确率 {entry.accuracy}%
          </span>
          <span className="text-[10px] text-slate-500 font-mono">
            {metric === 'spend'
              ? `${Math.floor(entry.completionTime / 60)}:${String(entry.completionTime % 60).padStart(2, '0')}`
              : `${Math.round(entry.secondarySpendRate * 100)}%`}
          </span>
        </div>
      </div>
    </motion.div>
  )
}

export default function Leaderboard() {
  const showLeaderboard = useGameStore((s) => s.showLeaderboard)
  const setShowLeaderboard = useGameStore((s) => s.setShowLeaderboard)
  const activeTab = useGameStore((s) => s.leaderboardTab)
  const setLeaderboardTab = useGameStore((s) => s.setLeaderboardTab)

  const sortedData =
    activeTab === 'spend'
      ? [...leaderboardData].sort((a, b) => b.secondarySpendRate - a.secondarySpendRate)
      : [...leaderboardData].sort((a, b) => a.completionTime - b.completionTime)

  const bestEntry = sortedData[0]

  return (
    <AnimatePresence>
      {showLeaderboard && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm"
          onClick={() => setShowLeaderboard(false)}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            transition={{ type: 'spring', damping: 22, stiffness: 200 }}
            className="glass-panel rounded-2xl p-6 w-[440px] max-h-[85vh] overflow-hidden flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Trophy size={20} className="text-golden" />
                <h2 className="text-lg font-display font-bold text-white">排行榜</h2>
              </div>
              <button
                onClick={() => setShowLeaderboard(false)}
                className="w-8 h-8 rounded-lg bg-white/5 text-slate-400 hover:text-white hover:bg-white/10 transition flex items-center justify-center"
              >
                <X size={16} />
              </button>
            </div>

            {bestEntry && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="glass-card rounded-xl p-4 mb-4 bg-gradient-to-r from-vivid-orange/10 to-golden/10 border-golden/20"
              >
                <div className="flex items-center gap-3">
                  <div className="w-14 h-14 rounded-full bg-gradient-to-br from-golden to-vivid-orange flex items-center justify-center shadow-lg shadow-golden/30">
                    <Trophy size={26} className="text-white" />
                  </div>
                  <div className="flex-1">
                    <div className="text-[10px] text-golden font-display mb-0.5">🏆 当前榜首</div>
                    <div className="text-base font-display font-bold text-white">
                      {bestEntry.playerName}
                    </div>
                    <div className="flex items-center gap-3 mt-1">
                      <span className="text-xs font-mono text-golden">
                        二消 {Math.round(bestEntry.secondarySpendRate * 100)}%
                      </span>
                      <span className="text-xs font-mono text-emerald-400">
                        {Math.floor(bestEntry.completionTime / 60)}:
                        {String(bestEntry.completionTime % 60).padStart(2, '0')}
                      </span>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            <div className="flex gap-2 mb-4 p-1 bg-white/5 rounded-xl">
              <button
                onClick={() => setLeaderboardTab('spend')}
                className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-display transition ${
                  activeTab === 'spend'
                    ? 'bg-vivid-orange text-white shadow-lg shadow-vivid-orange/20'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <TrendingUp size={13} />
                二消转化榜
              </button>
              <button
                onClick={() => setLeaderboardTab('time')}
                className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-display transition ${
                  activeTab === 'time'
                    ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/20'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Clock size={13} />
                完成时间榜
              </button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-2 pr-1">
              {sortedData.map((entry) => (
                <LeaderboardRow key={entry.rank} entry={entry} metric={activeTab} />
              ))}
            </div>

            <div className="mt-4 pt-4 border-t border-white/5">
              <p className="text-[10px] text-center text-slate-500">
                💡 不只奖励速度，平衡二消转化与时间才能取得最高分
              </p>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
