import { useState } from 'react'
import { motion } from 'motion/react'
import { Play, MapPin, Users, Trophy } from 'lucide-react'
import { useGameStore } from '@/store/gameStore'
import { leaderboardData } from '@/data/gameData'

interface StartScreenProps {
  onStart: () => void
}

export default function StartScreen({ onStart }: StartScreenProps) {
  const setPlayerName = useGameStore((s) => s.setPlayerName)
  const [name, setName] = useState('')
  const [error, setError] = useState('')

  const handleStart = () => {
    const trimmed = name.trim()
    if (!trimmed) {
      setError('请输入你的名字')
      return
    }
    if (trimmed.length < 2) {
      setError('名字至少2个字符')
      return
    }
    setPlayerName(trimmed)
    onStart()
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleStart()
  }

  const topPlayer = leaderboardData[0]

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-gradient-to-b from-deep-navy via-deep-navy/95 to-deep-navy">
        <div className="absolute inset-0 overflow-hidden">
          {Array.from({ length: 50 }).map((_, i) => (
            <motion.div
              key={i}
              className="absolute rounded-full bg-white/10"
              style={{
                width: Math.random() * 3 + 1,
                height: Math.random() * 3 + 1,
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
              }}
              animate={{
                opacity: [0.3, 1, 0.3],
              }}
              transition={{
                duration: Math.random() * 3 + 2,
                repeat: Infinity,
                delay: Math.random() * 2,
              }}
            />
          ))}
        </div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: 'easeOut' }}
        className="relative z-10 w-full max-w-md mx-4"
      >
        <div className="text-center mb-8">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
            className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-to-br from-vivid-orange to-golden mb-4 shadow-[0_0_40px_rgba(255,107,53,0.4)]"
          >
            <MapPin size={36} className="text-white" />
          </motion.div>
          <h1 className="text-3xl font-black text-white mb-2 tracking-tight">
            景区运营导览调度
          </h1>
          <p className="text-sm text-slate-400">
            路线调度解谜 · 实战演练系统
          </p>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="glass-panel rounded-2xl p-6 mb-6"
        >
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-display text-slate-400 mb-2">
                训练者姓名
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => {
                  setName(e.target.value)
                  setError('')
                }}
                onKeyDown={handleKeyDown}
                placeholder="输入你的名字..."
                maxLength={12}
                className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder:text-slate-500 focus:outline-none focus:border-vivid-orange/50 focus:ring-2 focus:ring-vivid-orange/20 transition text-sm font-display"
              />
              {error && (
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="mt-2 text-xs text-red-400"
                >
                  {error}
                </motion.p>
              )}
            </div>

            <button
              onClick={handleStart}
              className="w-full flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-gradient-to-r from-vivid-orange to-golden text-white font-display font-bold text-base hover:shadow-[0_0_30px_rgba(255,107,53,0.5)] transition-all active:scale-[0.98]"
            >
              <Play size={18} fill="currentColor" />
              开始训练
            </button>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.55 }}
          className="grid grid-cols-3 gap-3 mb-6"
        >
          {[
            { icon: Users, label: '热力点位', value: '6 个', color: '#FF6B35' },
            { icon: MapPin, label: '导览路线', value: '4 条', color: '#3b82f6' },
            { icon: Trophy, label: '记录保持', value: topPlayer?.playerName || '-', color: '#F5C542' },
          ].map((item, i) => (
            <motion.div
              key={i}
              whileHover={{ y: -4 }}
              className="glass-card rounded-xl p-3 text-center"
            >
              <item.icon size={18} className="mx-auto mb-1.5" style={{ color: item.color }} />
              <div className="text-sm font-mono text-white font-semibold truncate">
                {item.value}
              </div>
              <div className="text-[10px] text-slate-400 font-display mt-0.5">
                {item.label}
              </div>
            </motion.div>
          ))}
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.7 }}
          className="text-center text-[10px] text-slate-500"
        >
          <p>🎯 观察热力 → 规划路线 → 分配座位 → 获取反馈</p>
        </motion.div>
      </motion.div>
    </div>
  )
}
