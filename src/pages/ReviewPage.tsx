import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, Legend, CartesianGrid,
} from 'recharts'
import { Home, ChevronDown, ChevronUp } from 'lucide-react'
import { useStatsStore } from '@/stores/useStatsStore'
import { useConfigStore } from '@/stores/useConfigStore'
import type { BottleneckType } from '@/types'

const TECH_NAMES: Record<string, string> = {
  'tech-1': '李美琳', 'tech-2': '张晓婷', 'tech-3': '王丽华',
  'tech-4': '陈思雨', 'tech-5': '赵雅芝',
}

const LEVEL_OPTIONS = [
  { id: 'level-001', name: '基础匹配' },
  { id: 'level-002', name: '进阶调度' },
  { id: 'level-003', name: '大师调度' },
]

const LEVEL_COLORS: Record<string, string> = {
  'level-001': '#B76E79',
  'level-002': '#7EB89E',
  'level-003': '#D4A853',
}

const BOTTLENECK_COLORS: Record<BottleneckType, string> = {
  hesitation: '#D4A853',
  mismatch: '#DC2626',
  timeout: '#F97316',
  'event-fail': '#7F1D1D',
}

const BOTTLENECK_LABELS: Record<BottleneckType, string> = {
  hesitation: '犹豫',
  mismatch: '错配',
  timeout: '超时',
  'event-fail': '事件失败',
}

const RADAR_DIMS = ['速度', '准确率', '产值', '异常处理', '星级']

export default function ReviewPage() {
  const navigate = useNavigate()
  const { sessions, getLevelComparison, getBottlenecksBySession, getOutputsByLevel } = useStatsStore()
  const { levels, loadConfigs } = useConfigStore()

  const [selectedLevels, setSelectedLevels] = useState<string[]>(['level-001', 'level-002', 'level-003'])
  const [expandedSession, setExpandedSession] = useState<string | null>(null)

  useMemo(() => { loadConfigs() }, [loadConfigs])

  const toggleLevel = (id: string) => {
    setSelectedLevels((prev) =>
      prev.includes(id) ? prev.filter((l) => l !== id) : [...prev, id]
    )
  }

  const maxTime = useMemo(() => {
    if (levels.length === 0) return 120
    return Math.max(...levels.map((l) => l.timeLimit))
  }, [levels])

  const radarData = useMemo(() => {
    if (selectedLevels.length === 0) return []
    const comparisons = getLevelComparison(selectedLevels)
    return RADAR_DIMS.map((dim) => {
      const entry: Record<string, string | number> = { dimension: dim }
      for (const comp of comparisons) {
        const levelName = LEVEL_OPTIONS.find((l) => l.id === comp.levelId)?.name || comp.levelId
        let value = 0
        if (dim === '速度') value = Math.round(100 - (comp.avgTimeUsed / maxTime) * 100)
        else if (dim === '准确率') value = Math.round(comp.avgAccuracy * 100)
        else if (dim === '产值') value = Math.round(comp.avgScore)
        else if (dim === '异常处理') value = Math.round(comp.avgAnomalyScore * 100)
        else if (dim === '星级') value = Math.round((comp.avgStars / 3) * 100)
        entry[levelName] = Math.max(0, value)
      }
      return entry
    })
  }, [selectedLevels, getLevelComparison, maxTime])

  const techCompareData = useMemo(() => {
    const allTechs = new Set<string>()
    const outputsByLevel: Record<string, ReturnType<typeof getOutputsByLevel>> = {}
    for (const levelId of selectedLevels) {
      outputsByLevel[levelId] = getOutputsByLevel(levelId)
      outputsByLevel[levelId].forEach((o) => allTechs.add(o.technicianId))
    }
    return Array.from(allTechs).map((techId) => {
      const entry: Record<string, string | number> = { name: TECH_NAMES[techId] || techId }
      for (const levelId of selectedLevels) {
        const levelName = LEVEL_OPTIONS.find((l) => l.id === levelId)?.name || levelId
        const out = outputsByLevel[levelId]?.find((o) => o.technicianId === techId)
        entry[levelName] = out?.outputValue ?? 0
      }
      return entry
    })
  }, [selectedLevels, getOutputsByLevel])

  const sessionBottlenecks = useMemo(() => {
    return sessions.map((s) => ({
      session: s,
      bns: getBottlenecksBySession(s.id),
      levelName: LEVEL_OPTIONS.find((l) => l.id === s.levelId)?.name || s.levelId,
    }))
  }, [sessions, getBottlenecksBySession])

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#1a0f0a' }}>
      <div className="max-w-5xl mx-auto px-6 py-10">
        <motion.h1 className="text-3xl font-bold mb-8"
          style={{ color: '#B76E79', fontFamily: "'Playfair Display', serif" }}
          initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          复盘分析
        </motion.h1>

        <div className="flex gap-4 mb-8 flex-wrap">
          {LEVEL_OPTIONS.map((level) => (
            <label key={level.id} className="flex items-center gap-2 cursor-pointer px-4 py-2 rounded-lg border"
              style={{
                borderColor: selectedLevels.includes(level.id) ? LEVEL_COLORS[level.id] : '#B76E7933',
                backgroundColor: selectedLevels.includes(level.id) ? '#2a1a14' : 'transparent',
                color: selectedLevels.includes(level.id) ? LEVEL_COLORS[level.id] : '#B76E7966',
              }}>
              <input type="checkbox" checked={selectedLevels.includes(level.id)}
                onChange={() => toggleLevel(level.id)} className="accent-[#B76E79]" />
              {level.name}
            </label>
          ))}
        </div>

        {selectedLevels.length > 0 && (
          <motion.div className="mb-10 rounded-xl p-6 border"
            style={{ backgroundColor: '#2a1a14', borderColor: '#B76E7944' }}
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <h2 className="text-lg font-semibold mb-4" style={{ color: '#B76E79' }}>多维对比</h2>
            <ResponsiveContainer width="100%" height={320}>
              <RadarChart data={radarData}>
                <PolarGrid stroke="#B76E7933" />
                <PolarAngleAxis dataKey="dimension" stroke="#B76E7988" fontSize={12} />
                <PolarRadiusAxis stroke="#B76E7944" fontSize={10} />
                {selectedLevels.map((levelId) => {
                  const name = LEVEL_OPTIONS.find((l) => l.id === levelId)?.name || levelId
                  return (
                    <Radar key={levelId} name={name} dataKey={name}
                      stroke={LEVEL_COLORS[levelId]} fill={LEVEL_COLORS[levelId]}
                      fillOpacity={0.15} strokeWidth={2} />
                  )
                })}
                <Legend />
                <Tooltip contentStyle={{ backgroundColor: '#2a1a14', border: '1px solid #B76E79', borderRadius: 8 }} />
              </RadarChart>
            </ResponsiveContainer>
          </motion.div>
        )}

        <motion.div className="mb-10 rounded-xl p-6 border"
          style={{ backgroundColor: '#2a1a14', borderColor: '#B76E7944' }}
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <h2 className="text-lg font-semibold mb-4" style={{ color: '#B76E79' }}>瓶颈热力图</h2>
          {sessionBottlenecks.length > 0 ? (
            <div className="space-y-3">
              {sessionBottlenecks.map(({ session, bns, levelName }) => {
                const level = levels.find((l) => l.id === session.levelId)
                const totalDuration = level?.timeLimit ?? 120
                return (
                  <div key={session.id}>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs" style={{ color: '#B76E7988' }}>{levelName}</span>
                      <span className="text-xs" style={{ color: '#B76E7966' }}>
                        {new Date(session.completedAt).toLocaleDateString()}
                      </span>
                    </div>
                    <div className="relative h-6 rounded overflow-hidden" style={{ backgroundColor: '#1a0f0a' }}>
                      {bns.map((b) => {
                        const left = (b.timestamp % totalDuration) / totalDuration * 100
                        const width = Math.max(2, (b.duration / totalDuration) * 100)
                        return (
                          <div key={b.id} className="absolute top-0 h-full rounded"
                            style={{
                              left: `${left}%`, width: `${width}%`,
                              backgroundColor: BOTTLENECK_COLORS[b.type],
                            }}
                            title={`${BOTTLENECK_LABELS[b.type]}: ${b.description}`}
                          />
                        )
                      })}
                    </div>
                  </div>
                )
              })}
            </div>
          ) : (
            <p className="text-center py-6" style={{ color: '#B76E7966' }}>暂无瓶颈数据</p>
          )}
        </motion.div>

        {selectedLevels.length > 0 && (
          <motion.div className="mb-10 rounded-xl p-6 border"
            style={{ backgroundColor: '#2a1a14', borderColor: '#B76E7944' }}
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
            <h2 className="text-lg font-semibold mb-4" style={{ color: '#B76E79' }}>技师产值对比</h2>
            {techCompareData.length > 0 ? (
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={techCompareData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#B76E7933" />
                  <XAxis dataKey="name" stroke="#B76E7988" fontSize={12} />
                  <YAxis stroke="#B76E7988" fontSize={12} />
                  <Tooltip contentStyle={{ backgroundColor: '#2a1a14', border: '1px solid #B76E79', borderRadius: 8 }} />
                  <Legend />
                  {selectedLevels.map((levelId) => {
                    const name = LEVEL_OPTIONS.find((l) => l.id === levelId)?.name || levelId
                    return <Bar key={levelId} dataKey={name} fill={LEVEL_COLORS[levelId]} radius={[4, 4, 0, 0]} />
                  })}
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-center py-6" style={{ color: '#B76E7966' }}>暂无数据</p>
            )}
          </motion.div>
        )}

        <motion.div className="mb-10 rounded-xl p-6 border"
          style={{ backgroundColor: '#2a1a14', borderColor: '#B76E7944' }}
          initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
          <h2 className="text-lg font-semibold mb-4" style={{ color: '#B76E79' }}>对局详情</h2>
          {sessionBottlenecks.length > 0 ? (
            <div className="space-y-2">
              {sessionBottlenecks.map(({ session, bns, levelName }) => (
                <div key={session.id} className="rounded-lg border"
                  style={{ borderColor: '#B76E7933', backgroundColor: '#1a0f0a' }}>
                  <button className="w-full flex items-center justify-between px-4 py-3"
                    onClick={() => setExpandedSession(expandedSession === session.id ? null : session.id)}>
                    <div className="flex items-center gap-3">
                      <span style={{ color: '#B76E79' }}>{levelName}</span>
                      <span className="text-sm" style={{ color: '#D4A853' }}>
                        {'★'.repeat(session.stars)}{'☆'.repeat(3 - session.stars)}
                      </span>
                      <span className="text-sm" style={{ color: '#B76E7988' }}>{session.score}分</span>
                    </div>
                    {expandedSession === session.id
                      ? <ChevronUp className="w-4 h-4" style={{ color: '#B76E7966' }} />
                      : <ChevronDown className="w-4 h-4" style={{ color: '#B76E7966' }} />}
                  </button>
                  <AnimatePresence>
                    {expandedSession === session.id && (
                      <motion.div className="px-4 pb-3" initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}>
                        <div className="grid grid-cols-3 gap-2 text-sm mb-2">
                          <span style={{ color: '#B76E7988' }}>用时: {session.timeUsed}s</span>
                          <span style={{ color: '#B76E7988' }}>准确率: {Math.round(session.accuracy * 100)}%</span>
                          <span style={{ color: '#B76E7988' }}>异常分: {Math.round(session.anomalyScore * 100)}</span>
                        </div>
                        {bns.length > 0 ? (
                          <div className="space-y-1">
                            {bns.map((b) => (
                              <div key={b.id} className="flex items-center gap-2 text-xs">
                                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: BOTTLENECK_COLORS[b.type] }} />
                                <span style={{ color: '#B76E7988' }}>{BOTTLENECK_LABELS[b.type]}</span>
                                <span style={{ color: '#B76E7966' }}>{b.description}</span>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-xs" style={{ color: '#B76E7966' }}>无瓶颈记录</p>
                        )}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-center py-6" style={{ color: '#B76E7966' }}>暂无对局记录</p>
          )}
        </motion.div>

        <motion.div className="flex justify-center"
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.6 }}>
          <button onClick={() => navigate('/')}
            className="flex items-center gap-2 px-6 py-3 rounded-lg border transition-colors"
            style={{ borderColor: '#B76E79', color: '#B76E79' }}>
            <Home className="w-4 h-4" />
            返回主页
          </button>
        </motion.div>
      </div>
    </div>
  )
}
