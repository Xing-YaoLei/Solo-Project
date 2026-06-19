import { useState, useEffect } from 'react'
import { createFileRoute } from '@tanstack/react-router'
import { api } from '@/api/client'
import type { StatsByChannel, StatsByHandler, StatsByClosureDuration, StatsByReviewTag } from '@/types'

export const Route = createFileRoute('/stats')({
  component: StatsPage,
})

const CHANNEL_COLORS = [
  'bg-blue-500',
  'bg-emerald-500',
  'bg-amber-500',
  'bg-purple-500',
  'bg-rose-500',
]

const TAG_COLORS = [
  'bg-blue-100 text-blue-700',
  'bg-emerald-100 text-emerald-700',
  'bg-amber-100 text-amber-700',
  'bg-purple-100 text-purple-700',
  'bg-rose-100 text-rose-700',
  'bg-cyan-100 text-cyan-700',
  'bg-orange-100 text-orange-700',
]

function StatsPage() {
  const [channelStats, setChannelStats] = useState<StatsByChannel[]>([])
  const [handlerStats, setHandlerStats] = useState<StatsByHandler[]>([])
  const [durationStats, setDurationStats] = useState<StatsByClosureDuration[]>([])
  const [tagStats, setTagStats] = useState<StatsByReviewTag[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchAll = async () => {
      try {
        const [ch, ha, du, ta] = await Promise.all([
          api.stats.byChannel(),
          api.stats.byHandler(),
          api.stats.byClosureDuration(),
          api.stats.byReviewTag(),
        ])
        setChannelStats(ch)
        setHandlerStats(ha)
        setDurationStats(du)
        setTagStats(ta)
      } catch {
      } finally {
        setLoading(false)
      }
    }
    fetchAll()
  }, [])

  if (loading) {
    return <div className="text-center py-12 text-slate-400">加载中...</div>
  }

  const maxChannelCount = Math.max(...channelStats.map(s => s.count), 1)

  return (
    <div>
      <h2 className="text-xl font-semibold text-slate-800 mb-4">统计聚合</h2>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div className="bg-white rounded-lg border border-slate-200 p-4">
          <h3 className="text-sm font-semibold text-slate-800 mb-4">按来源渠道汇总</h3>
          {channelStats.length === 0 ? (
            <p className="text-sm text-slate-400 text-center py-4">暂无数据</p>
          ) : (
            <div className="space-y-3">
              {channelStats.map((s, i) => (
                <div key={s.channel}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm text-slate-700">{s.channel}</span>
                    <span className="text-sm font-medium text-slate-800">{s.count}</span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-4">
                    <div
                      className={`h-4 rounded-full ${CHANNEL_COLORS[i % CHANNEL_COLORS.length]} transition-all`}
                      style={{ width: `${(s.count / maxChannelCount) * 100}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-white rounded-lg border border-slate-200 p-4">
          <h3 className="text-sm font-semibold text-slate-800 mb-4">按关闭时长汇总</h3>
          {durationStats.length === 0 ? (
            <p className="text-sm text-slate-400 text-center py-4">暂无数据</p>
          ) : (
            <div className="space-y-3">
              {durationStats.map((s, i) => {
                const colors = ['bg-green-100 text-green-700', 'bg-yellow-100 text-yellow-700', 'bg-red-100 text-red-700']
                return (
                  <div key={s.duration_range} className="flex items-center justify-between p-3 rounded-lg bg-slate-50">
                    <div className="flex items-center gap-2">
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${colors[i % colors.length]}`}>
                        {s.duration_range}
                      </span>
                    </div>
                    <span className="text-lg font-semibold text-slate-800">{s.count}</span>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        <div className="bg-white rounded-lg border border-slate-200 p-4">
          <h3 className="text-sm font-semibold text-slate-800 mb-4">按责任人汇总</h3>
          {handlerStats.length === 0 ? (
            <p className="text-sm text-slate-400 text-center py-4">暂无数据</p>
          ) : (
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-200">
                  <th className="px-3 py-2 text-xs">处理人</th>
                  <th className="px-3 py-2 text-xs text-right">客诉数量</th>
                </tr>
              </thead>
              <tbody>
                {handlerStats.map(s => (
                  <tr key={s.handler_name} className="border-b border-slate-100">
                    <td className="px-3 py-2 text-sm text-slate-700">{s.handler_name}</td>
                    <td className="px-3 py-2 text-sm text-slate-800 font-medium text-right">{s.count}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        <div className="bg-white rounded-lg border border-slate-200 p-4">
          <h3 className="text-sm font-semibold text-slate-800 mb-4">按复盘标签汇总</h3>
          {tagStats.length === 0 ? (
            <p className="text-sm text-slate-400 text-center py-4">暂无数据</p>
          ) : (
            <div className="flex flex-wrap gap-3">
              {tagStats.map((s, i) => {
                const size = Math.max(14, Math.min(32, 14 + s.count * 2))
                return (
                  <span
                    key={s.tag}
                    className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-full font-medium ${TAG_COLORS[i % TAG_COLORS.length]}`}
                    style={{ fontSize: `${size}px` }}
                  >
                    {s.tag}
                    <span className="opacity-70">({s.count})</span>
                  </span>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
