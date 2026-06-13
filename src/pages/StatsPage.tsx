import { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer, CartesianGrid } from 'recharts'
import { Home, ChevronRight, Clock, Target, TrendingUp, Award } from 'lucide-react'
import { useStatsStore } from '@/stores/useStatsStore'
import { useConfigStore } from '@/stores/useConfigStore'

const TECH_NAMES: Record<string, string> = {
  'tech-1': '李美琳',
  'tech-2': '张晓婷',
  'tech-3': '王丽华',
  'tech-4': '陈思雨',
  'tech-5': '赵雅芝',
}

const LEVEL_NAMES: Record<string, string> = {
  'level-001': '基础匹配',
  'level-002': '进阶调度',
  'level-003': '大师调度',
}

const sectionFade = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
}

export default function StatsPage() {
  const navigate = useNavigate()
  const { sessions, technicianOutputs, getPlayerStats } = useStatsStore()
  const { loadConfigs } = useConfigStore()

  useMemo(() => { loadConfigs() }, [loadConfigs])

  const playerStats = useMemo(() => getPlayerStats(), [getPlayerStats])
  const highScore = useMemo(() => {
    if (sessions.length === 0) return 0
    return Math.max(...sessions.map((s) => s.score))
  }, [sessions])

  const techChartData = useMemo(() => {
    const grouped: Record<string, Record<string, number>> = {}
    for (const out of technicianOutputs) {
      const name = TECH_NAMES[out.technicianId] || out.technicianId
      const level = LEVEL_NAMES[out.levelId] || out.levelId
      if (!grouped[name]) grouped[name] = {}
      grouped[name][level] = (grouped[name][level] || 0) + out.outputValue
    }
    return Object.entries(grouped).map(([name, levels]) => {
      const entry: Record<string, string | number> = { name }
      for (const [level, value] of Object.entries(levels)) {
        entry[level] = value
      }
      return entry
    })
  }, [technicianOutputs])

  const barColors = ['#B76E79', '#7EB89E', '#D4A853']

  const summaryCards = [
    { label: '总关卡数', value: playerStats.totalLevels, icon: Target, suffix: '关' },
    { label: '平均用时', value: Math.round(playerStats.avgTime), icon: Clock, suffix: '秒' },
    { label: '平均准确率', value: Math.round(playerStats.avgAccuracy * 100), icon: TrendingUp, suffix: '%' },
    { label: '最高评分', value: highScore, icon: Award, suffix: '分' },
  ]

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#1a0f0a' }}>
      <div className="max-w-5xl mx-auto px-6 py-10">
        <motion.h1 className="text-3xl font-bold mb-8"
          style={{ color: '#B76E79', fontFamily: "'Playfair Display', serif" }}
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.5 }}>
          训练统计
        </motion.h1>

        <motion.div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10"
          variants={sectionFade} initial="hidden" animate="visible">
          {summaryCards.map((card) => (
            <div key={card.label} className="rounded-xl p-5 border text-center"
              style={{ backgroundColor: '#2a1a14', borderColor: '#B76E7944' }}>
              <card.icon className="w-5 h-5 mx-auto mb-2" style={{ color: '#B76E79' }} />
              <p className="text-2xl font-bold" style={{ color: '#B76E79' }}>
                {card.value}<span className="text-sm ml-1" style={{ color: '#B76E7988' }}>{card.suffix}</span>
              </p>
              <p className="text-xs mt-1" style={{ color: '#B76E7966' }}>{card.label}</p>
            </div>
          ))}
        </motion.div>

        <motion.div className="mb-10 rounded-xl p-6 border"
          style={{ backgroundColor: '#2a1a14', borderColor: '#B76E7944' }}
          variants={sectionFade} initial="hidden" animate="visible" transition={{ delay: 0.2 }}>
          <h2 className="text-lg font-semibold mb-4" style={{ color: '#B76E79' }}>技师产值对比</h2>
          {techChartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={techChartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#B76E7933" />
                <XAxis dataKey="name" stroke="#B76E7988" fontSize={12} />
                <YAxis stroke="#B76E7988" fontSize={12} />
                <Tooltip contentStyle={{ backgroundColor: '#2a1a14', border: '1px solid #B76E79', borderRadius: 8 }} />
                <Legend />
                {Object.values(LEVEL_NAMES).map((name, i) => (
                  <Bar key={name} dataKey={name} fill={barColors[i]} radius={[4, 4, 0, 0]} />
                ))}
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-center py-10" style={{ color: '#B76E7966' }}>暂无数据，完成关卡后显示</p>
          )}
        </motion.div>

        <motion.div className="mb-10 rounded-xl p-6 border"
          style={{ backgroundColor: '#2a1a14', borderColor: '#B76E7944' }}
          variants={sectionFade} initial="hidden" animate="visible" transition={{ delay: 0.4 }}>
          <h2 className="text-lg font-semibold mb-4" style={{ color: '#B76E79' }}>对局记录</h2>
          {sessions.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr style={{ color: '#B76E7988' }}>
                    <th className="text-left py-2 px-3">关卡</th>
                    <th className="text-left py-2 px-3">评分</th>
                    <th className="text-left py-2 px-3">星级</th>
                    <th className="text-left py-2 px-3">用时</th>
                    <th className="text-left py-2 px-3">准确率</th>
                    <th className="text-left py-2 px-3">日期</th>
                  </tr>
                </thead>
                <tbody>
                  {sessions.map((s) => (
                    <tr key={s.id} className="border-t" style={{ borderColor: '#B76E7922' }}>
                      <td className="py-2 px-3" style={{ color: '#B76E79' }}>
                        {LEVEL_NAMES[s.levelId] || s.levelId}
                      </td>
                      <td className="py-2 px-3" style={{ color: '#B76E7988' }}>{s.score}</td>
                      <td className="py-2 px-3" style={{ color: '#D4A853' }}>
                        {'★'.repeat(s.stars)}{'☆'.repeat(3 - s.stars)}
                      </td>
                      <td className="py-2 px-3" style={{ color: '#B76E7988' }}>{s.timeUsed}s</td>
                      <td className="py-2 px-3" style={{ color: '#B76E7988' }}>
                        {Math.round(s.accuracy * 100)}%
                      </td>
                      <td className="py-2 px-3" style={{ color: '#B76E7966' }}>
                        {new Date(s.completedAt).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-center py-10" style={{ color: '#B76E7966' }}>暂无对局记录</p>
          )}
        </motion.div>

        <motion.div className="flex gap-4 justify-center"
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.6 }}>
          <button onClick={() => navigate('/')}
            className="flex items-center gap-2 px-6 py-3 rounded-lg border transition-colors"
            style={{ borderColor: '#B76E79', color: '#B76E79' }}>
            <Home className="w-4 h-4" />
            返回主页
          </button>
          <button onClick={() => navigate('/review')}
            className="flex items-center gap-2 px-6 py-3 rounded-lg border transition-colors"
            style={{ borderColor: '#B76E79', color: '#B76E79' }}>
            <ChevronRight className="w-4 h-4" />
            查看复盘
          </button>
        </motion.div>
      </div>
    </div>
  )
}
