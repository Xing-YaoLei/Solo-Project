import { useEffect, useMemo } from 'react'
import { useParams, useNavigate, useLocation } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Star, RotateCcw, Eye, Home } from 'lucide-react'
import { useStatsStore } from '@/stores/useStatsStore'
import { useGameStore } from '@/stores/useGameStore'
import type { GameSession, TechnicianOutput } from '@/types'

const stagger = {
  hidden: { opacity: 0, y: 20 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.15, duration: 0.5, ease: 'easeOut' },
  }),
}

function StarRating({ stars }: { stars: number }) {
  return (
    <div className="flex items-center justify-center gap-3">
      {[1, 2, 3].map((n) => (
        <motion.div
          key={n}
          initial={{ scale: 0, rotate: -180 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ delay: 0.3 + n * 0.2, type: 'spring', stiffness: 200 }}
        >
          <Star
            className="w-12 h-12"
            fill={n <= stars ? '#FFD700' : 'transparent'}
            stroke={n <= stars ? '#FFD700' : '#555'}
            strokeWidth={2}
          />
        </motion.div>
      ))}
    </div>
  )
}

function StatItem({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="flex flex-col items-center gap-1 py-3 px-2 rounded-lg bg-[#3E2723]/20">
      <span className="text-xl font-bold text-[#B76E79]">{value}</span>
      <span className="text-xs text-[#FFFFF0]/50">{label}</span>
    </div>
  )
}

export default function SettlementPage() {
  const { levelId } = useParams<{ levelId: string }>()
  const navigate = useNavigate()
  const location = useLocation()
  const sessionId = (location.state as { sessionId?: string })?.sessionId

  const sessions = useStatsStore((s) => s.sessions)
  const allTechOutputs = useStatsStore((s) => s.technicianOutputs)
  const addSession = useStatsStore((s) => s.addSession)
  const addTechnicianOutput = useStatsStore((s) => s.addTechnicianOutput)
  const addBottlenecks = useStatsStore((s) => s.addBottlenecks)

  const technicianOutputs = useGameStore((s) => s.technicianOutputs)
  const currentLevel = useGameStore((s) => s.currentLevel)
  const matchedCount = useGameStore((s) => s.matchedCount)
  const wrongCount = useGameStore((s) => s.wrongCount)
  const timeRemaining = useGameStore((s) => s.timeRemaining)
  const technicians = useGameStore((s) => s.technicians)

  useEffect(() => {
    const levelSessions = sessions.filter((s) => s.levelId === levelId)
    if (levelSessions.length > 0) return

    try {
      const session = useGameStore.getState().completeLevel()
      addSession(session)

      const outputs = useGameStore.getState().technicianOutputs
      for (const output of outputs) {
        addTechnicianOutput(output)
      }

      const bns = useGameStore.getState().bottlenecks.map((b) => ({
        ...b,
        sessionId: session.id,
      }))
      addBottlenecks(bns)
    } catch {
      // level already completed or no active level
    }
  }, [levelId, sessions, addSession, addTechnicianOutput, addBottlenecks])

  const session = useMemo<GameSession | null>(() => {
    if (sessionId) {
      const found = sessions.find((s) => s.id === sessionId)
      if (found) return found
    }
    const levelSessions = sessions.filter((s) => s.levelId === levelId)
    return levelSessions.length > 0 ? levelSessions[levelSessions.length - 1] : null
  }, [sessions, sessionId, levelId])

  const techOutputRows = useMemo<TechnicianOutput[]>(() => {
    if (!session) return []
    const levelOutputs = allTechOutputs.filter(
      (o) => o.levelId === levelId && o.sessionId === session.id
    )
    return levelOutputs.length > 0 ? levelOutputs : technicianOutputs
  }, [session, allTechOutputs, levelId, technicianOutputs])

  const timeUsed = session?.timeUsed ?? (currentLevel ? currentLevel.timeLimit - timeRemaining : 0)
  const accuracy = session?.accuracy ?? (matchedCount + wrongCount > 0 ? matchedCount / (matchedCount + wrongCount) : 0)
  const anomalyScore = session?.anomalyScore ?? 0
  const score = session?.score ?? 0
  const stars = session?.stars ?? 1
  const difficulty = currentLevel?.difficulty ?? 1

  return (
    <div className="w-full min-h-screen bg-gradient-to-b from-[#1a0f0a] via-[#2a1a14] to-[#1a0f0a] flex items-start justify-center pt-10 pb-20 px-4">
      <div className="w-full max-w-2xl space-y-6">
        <motion.div custom={0} variants={stagger} initial="hidden" animate="visible" className="text-center space-y-4">
          <h1 className="text-2xl font-bold text-[#FFFFF0]/90">关卡结算</h1>
          <StarRating stars={stars} />
          <motion.div
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 1, type: 'spring', stiffness: 150 }}
            className="text-5xl font-black text-[#B76E79]"
          >
            {score}
          </motion.div>
          <p className="text-sm text-[#FFFFF0]/50">总分</p>
        </motion.div>

        <motion.div custom={1} variants={stagger} initial="hidden" animate="visible">
          <div className="grid grid-cols-3 gap-3">
            <StatItem label="用时" value={`${Math.floor(timeUsed / 60)}:${String(Math.floor(timeUsed % 60)).padStart(2, '0')}`} />
            <StatItem label="准确率" value={`${Math.round(accuracy * 100)}%`} />
            <StatItem label="异常处理分" value={anomalyScore.toFixed(1)} />
            <StatItem label="匹配成功" value={matchedCount} />
            <StatItem label="失误次数" value={wrongCount} />
            <StatItem label="难度系数" value={`×${difficulty}`} />
          </div>
        </motion.div>

        <motion.div custom={2} variants={stagger} initial="hidden" animate="visible" className="space-y-3">
          <h2 className="text-base font-bold text-[#FFFFF0]/80">技师产出</h2>
          <div className="rounded-xl border border-[#3E2723]/40 overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-[#3E2723]/30">
                  <th className="py-2.5 px-3 text-left text-[#FFFFF0]/60 font-medium">技师名</th>
                  <th className="py-2.5 px-3 text-center text-[#FFFFF0]/60 font-medium">产值</th>
                  <th className="py-2.5 px-3 text-center text-[#FFFFF0]/60 font-medium">完成任务</th>
                  <th className="py-2.5 px-3 text-center text-[#FFFFF0]/60 font-medium">异常处理</th>
                </tr>
              </thead>
              <tbody>
                {techOutputRows.map((row) => {
                  const tech = technicians.find((t) => t.id === row.technicianId)
                  return (
                    <tr key={row.id} className="border-t border-[#3E2723]/20">
                      <td className="py-2.5 px-3 text-[#FFFFF0]/80">{tech?.name ?? '未知'}</td>
                      <td className="py-2.5 px-3 text-center text-[#B76E79]">{row.outputValue}</td>
                      <td className="py-2.5 px-3 text-center text-[#FFFFF0]/70">{row.tasksCompleted}</td>
                      <td className="py-2.5 px-3 text-center text-[#FFFFF0]/70">{row.anomaliesHandled}</td>
                    </tr>
                  )
                })}
                {techOutputRows.length === 0 && (
                  <tr>
                    <td colSpan={4} className="py-4 text-center text-[#FFFFF0]/30">暂无数据</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </motion.div>

        <motion.div custom={3} variants={stagger} initial="hidden" animate="visible" className="flex gap-3 pt-2">
          <button
            onClick={() => navigate(`/game/${levelId}`)}
            className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-[#B76E79]/20 border border-[#B76E79]/50 text-[#B76E79] font-medium hover:bg-[#B76E79]/30 active:scale-[0.98] transition-all"
          >
            <RotateCcw className="w-4 h-4" />
            再来一次
          </button>
          <button
            onClick={() => navigate('/review')}
            className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-[#3E2723]/30 border border-[#3E2723]/50 text-[#FFFFF0]/70 font-medium hover:bg-[#3E2723]/40 active:scale-[0.98] transition-all"
          >
            <Eye className="w-4 h-4" />
            查看复盘
          </button>
          <button
            onClick={() => navigate('/')}
            className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-[#3E2723]/30 border border-[#3E2723]/50 text-[#FFFFF0]/70 font-medium hover:bg-[#3E2723]/40 active:scale-[0.98] transition-all"
          >
            <Home className="w-4 h-4" />
            返回主页
          </button>
        </motion.div>
      </div>
    </div>
  )
}
