import { useState } from 'react'
import { createRoute } from '@tanstack/react-router'
import { useQuery } from '@tanstack/react-query'
import { Route as rootRoute } from '../__root'
import {
  getEfficiencyStats,
  getSourceStats,
  getAssigneeStats,
  getConclusionStats,
} from '../../api/summary'
import SummaryCard from '../../components/SummaryCard'
import type { SourceType, SummaryFilterParams } from '../../types'
import { SOURCE_LABELS } from '../../types'

export const Route = createRoute({
  getParentRoute: () => rootRoute,
  path: '/summary',
  component: SummaryPage,
})

function SummaryPage() {
  const [filters, setFilters] = useState<SummaryFilterParams>({})

  const { data: efficiency, isLoading: effLoading } = useQuery({
    queryKey: ['summary-efficiency', filters],
    queryFn: () => getEfficiencyStats(filters),
  })

  const { data: sourceStats, isLoading: srcLoading } = useQuery({
    queryKey: ['summary-source', filters],
    queryFn: () => getSourceStats(filters),
  })

  const { data: assigneeStats, isLoading: assLoading } = useQuery({
    queryKey: ['summary-assignee', filters],
    queryFn: () => getAssigneeStats(filters),
  })

  const { data: conclusionStats, isLoading: conLoading } = useQuery({
    queryKey: ['summary-conclusion', filters],
    queryFn: () => getConclusionStats(filters),
  })

  const inputClass =
    'rounded-md border border-gray-300 px-3 py-1.5 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white'

  const loading = effLoading || srcLoading || assLoading || conLoading

  const totalSourceCount = sourceStats?.reduce((sum, s) => sum + s.count, 0) || 1

  return (
    <div className="p-6">
      <h2 className="text-xl font-semibold text-gray-900 mb-6">汇总统计</h2>

      <div className="bg-white rounded-lg border border-gray-200 p-4 mb-6">
        <div className="flex flex-wrap items-end gap-3">
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">开始日期</label>
            <input
              type="date"
              value={filters.date_from || ''}
              onChange={(e) =>
                setFilters((f) => ({ ...f, date_from: e.target.value || undefined }))
              }
              className={inputClass}
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">结束日期</label>
            <input
              type="date"
              value={filters.date_to || ''}
              onChange={(e) =>
                setFilters((f) => ({ ...f, date_to: e.target.value || undefined }))
              }
              className={inputClass}
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">来源</label>
            <select
              value={filters.source || ''}
              onChange={(e) =>
                setFilters((f) => ({
                  ...f,
                  source: (e.target.value as SourceType) || undefined,
                }))
              }
              className={inputClass}
            >
              <option value="">全部来源</option>
              {Object.entries(SOURCE_LABELS).map(([key, label]) => (
                <option key={key} value={key}>
                  {label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">负责人</label>
            <input
              type="text"
              value={filters.assignee || ''}
              onChange={(e) =>
                setFilters((f) => ({ ...f, assignee: e.target.value || undefined }))
              }
              placeholder="筛选负责人"
              className={`${inputClass} w-36`}
            />
          </div>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
          <span className="ml-3 text-gray-500">加载中...</span>
        </div>
      ) : (
        <div className="space-y-6">
          <div>
            <h3 className="text-base font-medium text-gray-900 mb-3">核销效率</h3>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <SummaryCard
                title="核销单据总数"
                value={efficiency?.total ?? 0}
              />
              <SummaryCard
                title="核销率"
                value={`${efficiency?.efficiency_rate?.toFixed(1) ?? 0}%`}
                subtitle={`${efficiency?.verified ?? 0} / ${efficiency?.total ?? 0}`}
              />
              <SummaryCard
                title="平均处理时长"
                value={
                  efficiency?.avg_time_hours
                    ? `${efficiency.avg_time_hours.toFixed(1)}h`
                    : '-'
                }
              />
              <SummaryCard
                title="已核销"
                value={efficiency?.verified ?? 0}
              />
            </div>
          </div>

          <div>
            <h3 className="text-base font-medium text-gray-900 mb-3">来源分布</h3>
            <div className="bg-white rounded-lg border border-gray-200 p-4">
              <div className="space-y-3">
                {sourceStats && sourceStats.length > 0 ? (
                  sourceStats.map((s) => {
                    const pct = ((s.count / totalSourceCount) * 100).toFixed(1)
                    return (
                      <div key={s.source} className="flex items-center gap-3">
                        <span className="text-sm text-gray-700 w-16">
                          {SOURCE_LABELS[s.source] || s.source}
                        </span>
                        <div className="flex-1 bg-gray-100 rounded-full h-4 overflow-hidden">
                          <div
                            className="bg-blue-500 h-full rounded-full transition-all"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                        <span className="text-sm text-gray-500 w-32 text-right">
                          {s.count} ({pct}%) · 争议 {s.disputed_count}
                        </span>
                      </div>
                    )
                  })
                ) : (
                  <p className="text-sm text-gray-400">暂无数据</p>
                )}
              </div>
            </div>
          </div>

          <div>
            <h3 className="text-base font-medium text-gray-900 mb-3">负责人统计</h3>
            <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      负责人
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      总数
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      已关闭
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      平均时长
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {assigneeStats && assigneeStats.length > 0 ? (
                    assigneeStats.map((a) => (
                      <tr key={a.assignee} className="hover:bg-gray-50">
                        <td className="px-4 py-3 text-sm font-medium text-gray-900">
                          {a.assignee}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-700">{a.count}</td>
                        <td className="px-4 py-3 text-sm text-green-600">{a.closed_count}</td>
                        <td className="px-4 py-3 text-sm text-blue-600">
                          {a.avg_time_hours > 0 ? `${a.avg_time_hours.toFixed(1)}h` : '-'}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td
                        colSpan={4}
                        className="px-4 py-8 text-center text-sm text-gray-400"
                      >
                        暂无数据
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div>
            <h3 className="text-base font-medium text-gray-900 mb-3">处理结论</h3>
            <div className="bg-white rounded-lg border border-gray-200 p-4">
              <div className="space-y-3">
                {conclusionStats && conclusionStats.length > 0 ? (
                  conclusionStats.map((c) => {
                    const total = conclusionStats.reduce((s, x) => s + x.count, 0) || 1
                    const pct = ((c.count / total) * 100).toFixed(1)
                    const colorMap: Record<string, string> = {
                      closed_normal: 'bg-green-500',
                      closed_dispute: 'bg-slate-500',
                      none: 'bg-gray-400',
                    }
                    return (
                      <div key={c.conclusion} className="flex items-center gap-3">
                        <span className="text-sm text-gray-700 w-24">
                          {c.conclusion === 'closed_normal'
                            ? '正常关闭'
                            : c.conclusion === 'closed_dispute'
                              ? '争议关闭'
                              : c.conclusion === 'none'
                                ? '未关闭'
                                : c.conclusion}
                        </span>
                        <div className="flex-1 bg-gray-100 rounded-full h-4 overflow-hidden">
                          <div
                            className={`${colorMap[c.conclusion] || 'bg-gray-500'} h-full rounded-full transition-all`}
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                        <span className="text-sm text-gray-500 w-24 text-right">
                          {c.count} ({pct}%)
                        </span>
                      </div>
                    )
                  })
                ) : (
                  <p className="text-sm text-gray-400">暂无数据</p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
