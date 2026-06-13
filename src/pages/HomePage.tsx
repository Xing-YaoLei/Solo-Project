import { useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Canvas, useFrame } from '@react-three/fiber'
import { TorusKnot } from '@react-three/drei'
import { Star, Lock, Trophy, BarChart3, RotateCcw, ChevronRight } from 'lucide-react'
import * as THREE from 'three'
import { useConfigStore } from '@/stores/useConfigStore'
import { useStatsStore } from '@/stores/useStatsStore'
import type { AchievementConfig, GameSession } from '@/types'

function RotatingKnot() {
  const ref = useRef<THREE.Mesh>(null)
  useFrame((_, delta) => {
    if (ref.current) {
      ref.current.rotation.y += delta * 0.5
      ref.current.rotation.x += delta * 0.3
    }
  })
  return (
    <TorusKnot ref={ref} args={[1, 0.3, 128, 32]}>
      <meshStandardMaterial color="#B76E79" metalness={0.8} roughness={0.2} />
    </TorusKnot>
  )
}

function isLevelUnlocked(requiredLevels: string[], sessions: GameSession[]): boolean {
  if (requiredLevels.length === 0) return true
  const completedIds = new Set(sessions.map((s) => s.levelId))
  return requiredLevels.every((id) => completedIds.has(id))
}

function isAchievementEarned(ach: AchievementConfig, sessions: GameSession[], levels: { id: string; timeLimit: number }[]): boolean {
  const cond = ach.condition
  if (cond.type === 'accuracy') {
    return sessions.some((s) => s.accuracy * 100 >= cond.threshold)
  }
  if (cond.type === 'time') {
    return sessions.some((s) => {
      const level = levels.find((l) => l.id === s.levelId)
      if (!level) return false
      return (s.timeUsed / level.timeLimit) * 100 <= cond.threshold
    })
  }
  if (cond.type === 'event') {
    return sessions.some((s) => s.anomalyScore * 100 >= cond.threshold)
  }
  if (cond.type === 'stars') {
    return sessions.some((s) => s.stars >= cond.threshold)
  }
  if (cond.type === 'level-clear') {
    return sessions.some((s) => s.levelId === `level-${String(cond.threshold).padStart(3, '0')}`)
  }
  return false
}

const cardVariants = {
  hidden: { opacity: 0, y: 30 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.15, duration: 0.5, ease: 'easeOut' },
  }),
}

export default function HomePage() {
  const navigate = useNavigate()
  const { levels, achievements, loadConfigs } = useConfigStore()
  const { sessions } = useStatsStore()

  useEffect(() => {
    loadConfigs()
  }, [loadConfigs])

  const lastSession = sessions.length > 0
    ? sessions.reduce((a, b) => (a.completedAt > b.completedAt ? a : b))
    : null

  return (
    <div className="min-h-screen relative overflow-hidden" style={{ backgroundColor: '#1a0f0a' }}>
      <div className="absolute top-16 right-8 w-44 h-44 opacity-50 pointer-events-none">
        <Canvas camera={{ position: [0, 0, 4] }}>
          <ambientLight intensity={0.5} />
          <pointLight position={[10, 10, 10]} />
          <RotatingKnot />
        </Canvas>
      </div>

      <div className="absolute top-0 left-0 w-64 h-64 rounded-full opacity-10"
        style={{ background: 'radial-gradient(circle, #B76E79 0%, transparent 70%)', transform: 'translate(-30%, -30%)' }} />
      <div className="absolute bottom-0 right-0 w-96 h-96 rounded-full opacity-10"
        style={{ background: 'radial-gradient(circle, #B76E79 0%, transparent 70%)', transform: 'translate(30%, 30%)' }} />

      <div className="relative z-10 max-w-5xl mx-auto px-6 py-12">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-14"
        >
          <h1 className="text-5xl md:text-6xl font-bold mb-3"
            style={{ fontFamily: "'Playfair Display', serif", color: '#B76E79' }}>
            美业手牌调度
          </h1>
          <p className="text-lg" style={{ color: '#B76E7988' }}>门店员工培训解谜游戏</p>
          <div className="mt-4 mx-auto w-32 h-0.5" style={{ backgroundColor: '#B76E79' }} />
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-14">
          {levels.map((level, i) => {
            const unlocked = isLevelUnlocked(level.requiredLevels, sessions)
            return (
              <motion.div
                key={level.id}
                custom={i}
                variants={cardVariants}
                initial="hidden"
                animate="visible"
                onClick={() => unlocked && navigate(`/game/${level.id}`)}
                className={`relative rounded-xl p-6 border cursor-pointer transition-transform hover:scale-105 ${
                  unlocked
                    ? 'border-opacity-40 hover:border-opacity-80'
                    : 'border-opacity-20 cursor-not-allowed'
                }`}
                style={{
                  backgroundColor: unlocked ? '#2a1a14' : '#1a1210',
                  borderColor: '#B76E79',
                  filter: unlocked ? 'none' : 'grayscale(0.8)',
                }}
              >
                {!unlocked && (
                  <div className="absolute inset-0 flex items-center justify-center rounded-xl"
                    style={{ backgroundColor: 'rgba(0,0,0,0.4)' }}>
                    <Lock className="w-8 h-8" style={{ color: '#B76E7966' }} />
                  </div>
                )}
                <h3 className="text-xl font-semibold mb-2" style={{ color: '#B76E79' }}>{level.name}</h3>
                <p className="text-sm mb-4" style={{ color: '#B76E7988' }}>{level.description}</p>
                <div className="flex items-center gap-1 mb-2">
                  {Array.from({ length: 3 }).map((_, si) => (
                    <Star key={si} className="w-4 h-4" fill={si < level.difficulty ? '#B76E79' : 'none'}
                      stroke="#B76E79" />
                  ))}
                </div>
                <div className="flex items-center justify-between text-xs" style={{ color: '#B76E7966' }}>
                  <span>限时 {level.timeLimit}s</span>
                  <span>及格 {level.passingScore}分</span>
                </div>
              </motion.div>
            )
          })}
        </div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6, duration: 0.5 }}
          className="mb-14"
        >
          <h2 className="text-2xl font-semibold mb-6" style={{ color: '#B76E79', fontFamily: "'Playfair Display', serif" }}>
            成就
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {achievements.map((ach) => {
              const earned = isAchievementEarned(ach, sessions, levels)
              return (
                <div key={ach.id} className="rounded-lg p-4 border flex items-center gap-3"
                  style={{
                    backgroundColor: earned ? '#2a1a14' : '#1a1210',
                    borderColor: earned ? '#B76E79' : '#B76E7933',
                    opacity: earned ? 1 : 0.5,
                  }}>
                  <span className="text-2xl">{ach.icon}</span>
                  <div>
                    <p className="text-sm font-medium" style={{ color: earned ? '#B76E79' : '#B76E7988' }}>
                      {ach.name}
                    </p>
                    <p className="text-xs" style={{ color: '#B76E7966' }}>{ach.description}</p>
                  </div>
                  {earned && <Trophy className="w-4 h-4 ml-auto" style={{ color: '#B76E79' }} />}
                </div>
              )
            })}
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8, duration: 0.5 }}
          className="flex flex-wrap gap-4 justify-center"
        >
          {lastSession && (
            <button onClick={() => navigate(`/game/${lastSession.levelId}`)}
              className="flex items-center gap-2 px-6 py-3 rounded-lg border transition-colors hover:bg-opacity-20"
              style={{ borderColor: '#B76E79', color: '#B76E79', backgroundColor: 'transparent' }}>
              <RotateCcw className="w-4 h-4" />
              继续上次
            </button>
          )}
          <button onClick={() => navigate('/stats')}
            className="flex items-center gap-2 px-6 py-3 rounded-lg border transition-colors hover:bg-opacity-20"
            style={{ borderColor: '#B76E79', color: '#B76E79', backgroundColor: 'transparent' }}>
            <BarChart3 className="w-4 h-4" />
            训练统计
          </button>
          <button onClick={() => navigate('/review')}
            className="flex items-center gap-2 px-6 py-3 rounded-lg border transition-colors hover:bg-opacity-20"
            style={{ borderColor: '#B76E79', color: '#B76E79', backgroundColor: 'transparent' }}>
            <ChevronRight className="w-4 h-4" />
            复盘分析
          </button>
        </motion.div>
      </div>
    </div>
  )
}
