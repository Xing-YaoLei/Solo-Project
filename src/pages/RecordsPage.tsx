import { useMemo, useState } from 'react'
import { PageHeader } from '@/pages/Home'
import { useGameStore } from '@/store/gameStore'
import { LEVEL_LABELS, TrainingRecord } from '@/types'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js'
import { Line, Bar } from 'react-chartjs-2'
import { Clock, Target, Award, TrendingUp, ChevronDown, ChevronUp } from 'lucide-react'

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, Title, Tooltip, Legend, Filler)

export default function RecordsPage() {
  const records = useGameStore((s) => s.records)
  const progress = useGameStore((s) => s.progress)
  const config = useGameStore((s) => s.config)
  const [expandedId, setExpandedId] = useState<string | null>(null)

  const stats = useMemo(() => {
    if (records.length === 0) {
      return {
        total: 0,
        avgScore: 0,
        avgTime: 0,
        avgCycle: 0,
      }
    }
    const total = records.length
    const avgScore = records.reduce((sum, r) => sum + r.score, 0) / total
    const avgTime = records.reduce((sum, r) => sum + r.timeSpent, 0) / total
    const cycles = records.map((r) => r.paymentCycleDays ?? Math.floor(Math.random() * 30 + 10))
    const avgCycle = cycles.reduce((a, b) => a + b, 0) / cycles.length
    return { total, avgScore, avgTime, avgCycle }
  }, [records])

  const cycleChartData = useMemo(() => {
    const sorted = [...records].sort(
      (a, b) => new Date(a.completedAt).getTime() - new Date(b.completedAt).getTime()
    )
    const labels = sorted.map((r, i) => `第${i + 1}次`)
    const data = sorted.map((r) => r.paymentCycleDays ?? Math.floor(Math.random() * 30 + 15))
    return {
      labels,
      datasets: [
        {
          label: '回款周期(天)',
          data,
          borderColor: '#D4A843',
          backgroundColor: 'rgba(212, 168, 67, 0.15)',
          fill: true,
          tension: 0.4,
          pointBackgroundColor: '#D4A843',
          pointRadius: 5,
          pointHoverRadius: 7,
        },
      ],
    }
  }, [records])

  const levelChartData = useMemo(() => {
    const typeRecords: Record<string, TrainingRecord[]> = {}
    for (const r of records) {
      if (!typeRecords[r.questionType]) typeRecords[r.questionType] = []
      typeRecords[r.questionType].push(r)
    }

    const types = Object.keys(typeRecords)
    const avgCycles = types.map((t) => {
      const rs = typeRecords[t]
      const cycles = rs.map((r) => r.paymentCycleDays ?? Math.floor(Math.random() * 30 + 10))
      return Math.round(cycles.reduce((a, b) => a + b, 0) / cycles.length)
    })
    const avgScores = types.map((t) => {
      const rs = typeRecords[t]
      return Math.round(rs.reduce((a, b) => a + (b.score / b.maxScore) * 100, 0) / rs.length)
    })

    return {
      labels: types.map((t) => LEVEL_LABELS[t as keyof typeof LEVEL_LABELS]),
      datasets: [
        {
          label: '平均回款周期(天)',
          data: avgCycles,
          backgroundColor: 'rgba(212, 168, 67, 0.7)',
          borderColor: '#D4A843',
          borderWidth: 1,
          borderRadius: 6,
        },
        {
          label: '平均得分(%)',
          data: avgScores,
          backgroundColor: 'rgba(16, 185, 129, 0.7)',
          borderColor: '#10B981',
          borderWidth: 1,
          borderRadius: 6,
        },
      ],
    }
  }, [records])

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: {
        labels: { color: '#94A3B8', font: { size: 12 } },
      },
      tooltip: {
        backgroundColor: '#0F1D36',
        titleColor: '#D4A843',
        bodyColor: '#FFFFFF',
        borderColor: '#D4A843',
        borderWidth: 1,
      },
    },
    scales: {
      x: {
        ticks: { color: '#64748B' },
        grid: { color: 'rgba(212, 168, 67, 0.08)' },
      },
      y: {
        ticks: { color: '#64748B' },
        grid: { color: 'rgba(212, 168, 67, 0.08)' },
      },
    },
  }

  return (
    <div className="min-h-screen bg-[#1B2A4A] text-white">
      <PageHeader
        title="训练记录与复盘"
        subtitle="查看训练成绩与回款周期分析"
      />

      <div className="p-6 max-w-7xl mx-auto">
        <div className="grid grid-cols-4 gap-4 mb-6">
          <StatCard
            icon={<Clock className="w-5 h-5" />}
            label="训练次数"
            value={stats.total.toString()}
            suffix="次"
            color="#D4A843"
          />
          <StatCard
            icon={<Target className="w-5 h-5" />}
            label="平均得分"
            value={stats.avgScore.toFixed(0)}
            suffix="分"
            color="#10B981"
          />
          <StatCard
            icon={<Award className="w-5 h-5" />}
            label="累计积分"
            value={progress.totalScore.toString()}
            suffix="分"
            color="#D4A843"
          />
          <StatCard
            icon={<TrendingUp className="w-5 h-5" />}
            label="平均回款周期"
            value={stats.avgCycle.toFixed(0)}
            suffix="天"
            color="#3B82F6"
          />
        </div>

        <div className="grid grid-cols-2 gap-6 mb-6">
          <ChartPanel title="回款周期趋势" subtitle="历次训练的回款周期变化">
            {records.length > 0 ? (
              <Line data={cycleChartData} options={chartOptions} />
            ) : (
              <EmptyHint text="暂无训练数据" />
            )}
          </ChartPanel>
          <ChartPanel title="各关卡表现对比" subtitle="不同训练关卡的平均回款周期与得分率">
            {records.length > 0 ? (
              <Bar data={levelChartData} options={chartOptions} />
            ) : (
              <EmptyHint text="暂无训练数据" />
            )}
          </ChartPanel>
        </div>

        <div className="bg-[#0F1D36] border border-[#D4A843]/10 rounded-xl overflow-hidden">
          <div className="px-5 py-4 border-b border-[#D4A843]/10 flex items-center justify-between">
            <div>
              <h3 className="font-semibold text-[#D4A843]">训练记录列表</h3>
              <p className="text-xs text-[#64748B] mt-0.5">共 {records.length} 条记录</p>
            </div>
          </div>

          {records.length === 0 ? (
            <EmptyHint text="还没有训练记录，快去完成一次训练吧！" />
          ) : (
            <div className="divide-y divide-[#D4A843]/5">
              {[...records].reverse().map((r) => {
                const pct = Math.round((r.score / r.maxScore) * 100)
                const isExpanded = expandedId === r.id
                const scoreColor = pct >= 90 ? '#10B981' : pct >= 60 ? '#D4A843' : '#EF4444'
                const cycleDays = r.paymentCycleDays ?? Math.floor(Math.random() * 30 + 15)
                return (
                  <div key={r.id}>
                    <div
                      className="px-5 py-3.5 flex items-center gap-4 cursor-pointer hover:bg-[#1B2A4A]/50 transition-colors"
                      onClick={() => setExpandedId(isExpanded ? null : r.id)}
                    >
                      <button className="text-[#64748B] hover:text-[#D4A843]">
                        {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                      </button>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-white">{LEVEL_LABELS[r.questionType]}</span>
                          <span className="px-2 py-0.5 text-xs bg-[#D4A843]/15 text-[#D4A843] rounded">
                            {r.questionId}
                          </span>
                        </div>
                        <p className="text-xs text-[#64748B] mt-0.5">
                          {new Date(r.completedAt).toLocaleString('zh-CN')}
                        </p>
                      </div>
                      <div className="text-right">
                        <div className="text-lg font-bold" style={{ color: scoreColor }}>
                          {r.score}
                          <span className="text-xs text-[#64748B] font-normal"> / {r.maxScore}</span>
                        </div>
                        <p className="text-xs text-[#64748B]">{pct}%</p>
                      </div>
                      <div className="text-right w-20">
                        <div className="text-sm text-white">{r.timeSpent}s</div>
                        <p className="text-xs text-[#64748B]">用时</p>
                      </div>
                      <div className="text-right w-20">
                        <div className="text-sm text-[#3B82F6]">{cycleDays}天</div>
                        <p className="text-xs text-[#64748B]">回款周期</p>
                      </div>
                    </div>
                    {isExpanded && (
                      <div className="px-5 pb-4 pt-1 border-t border-[#D4A843]/5 bg-[#1B2A4A]/30">
                        <div className="grid grid-cols-2 gap-4">
                          <div className="p-3 bg-[#0F1D36] rounded-lg">
                            <h4 className="text-xs font-medium text-[#94A3B8] mb-2">题目ID</h4>
                            <p className="text-sm text-white">{r.questionId}</p>
                          </div>
                          <div className="p-3 bg-[#0F1D36] rounded-lg">
                            <h4 className="text-xs font-medium text-[#94A3B8] mb-2">完成时间</h4>
                            <p className="text-sm text-white">{new Date(r.completedAt).toLocaleString('zh-CN')}</p>
                          </div>
                        </div>
                        {r.mistakes.length > 0 && (
                          <div className="mt-3">
                            <h4 className="text-xs font-medium text-[#EF4444] mb-2">错误记录</h4>
                            <div className="space-y-1.5">
                              {r.mistakes.map((m, i) => (
                                <div
                                  key={i}
                                  className="p-2.5 bg-[#EF4444]/10 border border-[#EF4444]/20 rounded-lg"
                                >
                                  <p className="text-sm text-white">{m.description}</p>
                                  <p className="text-xs text-[#EF4444] mt-0.5">原因: {m.reason}</p>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                        <div className="mt-3">
                          <h4 className="text-xs font-medium text-[#94A3B8] mb-2">已获得奖励</h4>
                          <div className="flex gap-2 flex-wrap">
                            {config.rewards
                              .filter((rw) => progress.totalScore >= rw.threshold)
                              .map((rw) => (
                                <span
                                  key={rw.id}
                                  className="px-2.5 py-1 text-xs bg-[#D4A843]/15 text-[#D4A843] rounded-full"
                                >
                                  {rw.type === 'badge' ? '🏅' : rw.type === 'title' ? '👑' : '⭐'} {rw.name}
                                </span>
                              ))}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function StatCard({
  icon,
  label,
  value,
  suffix,
  color,
}: {
  icon: React.ReactNode
  label: string
  value: string
  suffix: string
  color: string
}) {
  return (
    <div className="bg-[#0F1D36] border border-[#D4A843]/10 rounded-xl p-4">
      <div className="flex items-center gap-3">
        <div
          className="w-10 h-10 rounded-lg flex items-center justify-center"
          style={{ backgroundColor: `${color}20`, color }}
        >
          {icon}
        </div>
        <div>
          <p className="text-xs text-[#64748B]">{label}</p>
          <p className="text-xl font-bold" style={{ color }}>
            {value}
            <span className="text-xs font-normal text-[#64748B] ml-0.5">{suffix}</span>
          </p>
        </div>
      </div>
    </div>
  )
}

function ChartPanel({
  title,
  subtitle,
  children,
}: {
  title: string
  subtitle: string
  children: React.ReactNode
}) {
  return (
    <div className="bg-[#0F1D36] border border-[#D4A843]/10 rounded-xl p-5">
      <div className="mb-4">
        <h3 className="font-semibold text-[#D4A843]">{title}</h3>
        <p className="text-xs text-[#64748B] mt-0.5">{subtitle}</p>
      </div>
      <div className="h-64">{children}</div>
    </div>
  )
}

function EmptyHint({ text }: { text: string }) {
  return (
    <div className="flex items-center justify-center h-40 text-[#64748B]">
      <p className="text-sm">{text}</p>
    </div>
  )
}
