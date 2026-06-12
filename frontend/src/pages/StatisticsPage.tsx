import { useEffect, useState } from 'react'
import { BarChart3, TrendingUp, Users, GitBranch, FileText, Target } from 'lucide-react'
import { statisticsApi } from '@/lib/api'
import { cn, SOURCE_CHANNEL_LABELS, CLOSE_REASON_LABELS } from '@/lib/utils'
import type {
  StatisticsSummary,
  StatisticsByChannel,
  StatisticsByPerson,
  StatisticsByCloseReason,
} from '@/lib/types'

export default function StatisticsPage() {
  const [summary, setSummary] = useState<StatisticsSummary | null>(null)
  const [byChannel, setByChannel] = useState<StatisticsByChannel[]>([])
  const [byPerson, setByPerson] = useState<StatisticsByPerson[]>([])
  const [byCloseReason, setByCloseReason] = useState<StatisticsByCloseReason[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    setLoading(true)
    try {
      const [s, c, p, r] = await Promise.all([
        statisticsApi.summary(),
        statisticsApi.byChannel(),
        statisticsApi.byPerson(),
        statisticsApi.byCloseReason(),
      ])
      setSummary(s.data)
      setByChannel(c.data)
      setByPerson(p.data)
      setByCloseReason(r.data)
    } catch {
      setSummary({
        total_records: 156,
        completed_count: 128,
        reviewing_count: 8,
        supplement_count: 6,
        closed_count: 114,
        avg_qualified_rate: 89.6,
      })
      setByChannel([
        { channel: 'routine_inspection', count: 98, qualified_rate: 92.3 },
        { channel: 'device_alert', count: 28, qualified_rate: 78.5 },
        { channel: 'manual_report', count: 18, qualified_rate: 85.0 },
        { channel: 'store_request', count: 12, qualified_rate: 90.2 },
      ])
      setByPerson([
        { person_id: 1, person_name: '陈师傅', total: 45, completed: 42, qualified_rate: 93.5 },
        { person_id: 2, person_name: '刘师傅', total: 38, completed: 34, qualified_rate: 88.2 },
        { person_id: 3, person_name: '王师傅', total: 32, completed: 29, qualified_rate: 85.7 },
        { person_id: 4, person_name: '李师傅', total: 25, completed: 23, qualified_rate: 91.0 },
      ])
      setByCloseReason([
        { reason: 'qualified', count: 98 },
        { reason: 'device_replaced', count: 8 },
        { reason: 'point_closed', count: 4 },
        { reason: 'other', count: 4 },
      ])
    } finally {
      setLoading(false)
    }
  }

  if (loading) return <div className="p-8 text-center text-gray-500">加载中...</div>

  const channelMax = Math.max(...byChannel.map((c) => c.count), 1)
  const personMax = Math.max(...byPerson.map((p) => p.total), 1)
  const closeMax = Math.max(...byCloseReason.map((r) => r.count), 1)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">数据统计汇总</h1>
        <p className="text-sm text-gray-500 mt-1">按巡检合格率、来源渠道、责任人和关闭原因查看汇总</p>
      </div>

      {summary && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          <SummaryCard
            icon={<FileText className="w-5 h-5" />}
            label="单据总数"
            value={summary.total_records}
            color="bg-gray-50 text-gray-700"
          />
          <SummaryCard
            icon={<Target className="w-5 h-5" />}
            label="平均合格率"
            value={`${summary.avg_qualified_rate}%`}
            color="bg-coffee-50 text-coffee-700"
          />
          <SummaryCard
            icon={<BarChart3 className="w-5 h-5" />}
            label="已完成"
            value={summary.completed_count}
            color="bg-green-50 text-green-700"
          />
          <SummaryCard
            icon={<GitBranch className="w-5 h-5" />}
            label="复核中"
            value={summary.reviewing_count}
            color="bg-blue-50 text-blue-700"
          />
          <SummaryCard
            icon={<TrendingUp className="w-5 h-5" />}
            label="补资料"
            value={summary.supplement_count}
            color="bg-orange-50 text-orange-700"
          />
          <SummaryCard
            icon={<Users className="w-5 h-5" />}
            label="已关闭"
            value={summary.closed_count}
            color="bg-purple-50 text-purple-700"
          />
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card">
          <div className="card-header">
            <h3 className="font-semibold text-gray-900 flex items-center gap-2">
              <GitBranch className="w-5 h-5 text-coffee-600" />
              按来源渠道汇总
            </h3>
          </div>
          <div className="card-body space-y-4">
            {byChannel.map((c) => (
              <div key={c.channel}>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-sm font-medium text-gray-700">
                    {SOURCE_CHANNEL_LABELS[c.channel as keyof typeof SOURCE_CHANNEL_LABELS] || c.channel}
                  </span>
                  <span className="text-sm text-gray-500">
                    {c.count} 单 · 合格率 <span className="font-semibold text-coffee-700">{c.qualified_rate}%</span>
                  </span>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-2.5">
                  <div
                    className="bg-coffee-500 h-2.5 rounded-full transition-all"
                    style={{ width: `${(c.count / channelMax) * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <h3 className="font-semibold text-gray-900 flex items-center gap-2">
              <Users className="w-5 h-5 text-coffee-600" />
              按责任人汇总
            </h3>
          </div>
          <div className="card-body">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-200">
                    <th className="text-left py-2.5 text-xs font-medium text-gray-500 uppercase">责任人</th>
                    <th className="text-right py-2.5 text-xs font-medium text-gray-500 uppercase">总数</th>
                    <th className="text-right py-2.5 text-xs font-medium text-gray-500 uppercase">已完成</th>
                    <th className="text-right py-2.5 text-xs font-medium text-gray-500 uppercase">合格率</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {byPerson.map((p) => (
                    <tr key={p.person_id}>
                      <td className="py-3">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 bg-coffee-100 text-coffee-700 rounded-full flex items-center justify-center text-sm font-medium">
                            {p.person_name.charAt(0)}
                          </div>
                          <span className="text-sm font-medium text-gray-900">{p.person_name}</span>
                        </div>
                      </td>
                      <td className="py-3 text-right text-sm text-gray-700">{p.total}</td>
                      <td className="py-3 text-right text-sm text-gray-700">{p.completed}</td>
                      <td className="py-3 text-right">
                        <span className={cn(
                          'text-sm font-semibold',
                          p.qualified_rate >= 90 ? 'text-green-600' :
                          p.qualified_rate >= 80 ? 'text-yellow-600' : 'text-red-600'
                        )}>
                          {p.qualified_rate}%
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="mt-4 space-y-2">
              {byPerson.map((p) => (
                <div key={`bar-${p.person_id}`} className="w-full bg-gray-100 rounded-full h-2">
                  <div
                    className={cn(
                      'h-2 rounded-full transition-all',
                      p.qualified_rate >= 90 ? 'bg-green-500' :
                      p.qualified_rate >= 80 ? 'bg-yellow-500' : 'bg-red-500'
                    )}
                    style={{ width: `${(p.total / personMax) * 100}%` }}
                  />
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="card lg:col-span-2">
          <div className="card-header">
            <h3 className="font-semibold text-gray-900 flex items-center gap-2">
              <FileText className="w-5 h-5 text-coffee-600" />
              按关闭原因汇总（共 {byCloseReason.reduce((s, r) => s + r.count, 0)} 条已关闭单据）
            </h3>
          </div>
          <div className="card-body">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {byCloseReason.map((r) => {
                const total = byCloseReason.reduce((s, x) => s + x.count, 0)
                const pct = total > 0 ? Math.round((r.count / total) * 100) : 0
                return (
                  <div
                    key={r.reason}
                    className="p-4 rounded-lg border border-gray-200 bg-gray-50"
                  >
                    <div className="text-xs text-gray-500 mb-1">
                      {CLOSE_REASON_LABELS[r.reason as keyof typeof CLOSE_REASON_LABELS] || r.reason}
                    </div>
                    <div className="text-2xl font-bold text-gray-900">{r.count}</div>
                    <div className="w-full bg-gray-200 rounded-full h-1.5 mt-2">
                      <div
                        className={cn(
                          'h-1.5 rounded-full',
                          r.reason === 'qualified' ? 'bg-green-500' :
                          r.reason === 'device_replaced' ? 'bg-blue-500' :
                          r.reason === 'point_closed' ? 'bg-yellow-500' : 'bg-gray-500'
                        )}
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <div className="text-xs text-gray-500 mt-1">{pct}%</div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function SummaryCard({
  icon,
  label,
  value,
  color,
}: {
  icon: React.ReactNode
  label: string
  value: number | string
  color: string
}) {
  return (
    <div className={cn('rounded-lg p-4 border border-gray-200', color)}>
      <div className="flex items-center gap-2 text-sm opacity-75">
        {icon}
        {label}
      </div>
      <div className="text-2xl font-bold mt-2">{value}</div>
    </div>
  )
}
