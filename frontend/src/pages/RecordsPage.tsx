import { useEffect, useState } from 'react'
import { Link, useNavigate } from '@tanstack/react-router'
import { Plus, Search, WifiOff, AlertCircle, RefreshCw } from 'lucide-react'
import { cleaningApi, statisticsApi } from '@/lib/api'
import { StatusBadge } from '@/components/StatusBadge'
import { OfflineAlert } from '@/components/OfflineAlert'
import {
  formatDateTime,
  SOURCE_CHANNEL_LABELS,
  DEVICE_STATUS_LABELS,
  DEVICE_STATUS_COLORS,
  cn,
} from '@/lib/utils'
import type { CleaningRecord, CleaningStatus, StatisticsSummary } from '@/lib/types'

const STATUS_FILTERS: { value: CleaningStatus | 'all'; label: string }[] = [
  { value: 'all', label: '全部' },
  { value: 'draft', label: '草稿' },
  { value: 'pending_review', label: '待复核' },
  { value: 'supplement_info', label: '补资料' },
  { value: 'reviewing', label: '复核中' },
  { value: 'completed', label: '已完成' },
  { value: 'closed', label: '已关闭' },
]

export default function RecordsPage() {
  const navigate = useNavigate()
  const [records, setRecords] = useState<CleaningRecord[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [statusFilter, setStatusFilter] = useState<CleaningStatus | 'all'>('all')
  const [offlineOnly, setOfflineOnly] = useState(false)
  const [search, setSearch] = useState('')
  const [stats, setStats] = useState<StatisticsSummary | null>(null)

  useEffect(() => {
    loadData()
  }, [statusFilter, offlineOnly])

  const loadData = async () => {
    setLoading(true)
    setError(null)
    try {
      const params: Record<string, any> = {}
      if (statusFilter !== 'all') params.status = statusFilter
      if (offlineOnly) params.is_device_offline = true

      const [recordsRes, statsRes] = await Promise.all([
        cleaningApi.list(params),
        statisticsApi.summary(),
      ])
      setRecords(recordsRes.data.items)
      setTotal(recordsRes.data.total)
      setStats(statsRes.data)
    } catch (e: any) {
      const msg = e?.response?.data?.detail || e?.message || '加载失败，请检查后端服务'
      setError(msg)
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  const filteredRecords = records.filter((r) => {
    if (!search) return true
    return (
      r.record_no.toLowerCase().includes(search.toLowerCase()) ||
      r.store_point.name.includes(search) ||
      r.device.device_name.includes(search)
    )
  })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">清洁单据列表</h1>
          <p className="text-sm text-gray-500 mt-1">共 {total} 条单据</p>
        </div>
        <button
          onClick={() => navigate({ to: '/records/new' })}
          className="btn-primary gap-2"
        >
          <Plus className="w-4 h-4" />
          新建单据
        </button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-600 mt-0.5 flex-shrink-0" />
          <div className="flex-1">
            <p className="text-sm font-medium text-red-800">加载失败</p>
            <p className="text-sm text-red-700 mt-1">{error}</p>
          </div>
          <button onClick={loadData} className="btn-secondary text-sm gap-1">
            <RefreshCw className="w-4 h-4" /> 重试
          </button>
        </div>
      )}

      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <StatCard label="单据总数" value={stats.total_records} color="bg-gray-50 text-gray-900" />
          <StatCard label="复核中" value={stats.reviewing_count} color="bg-blue-50 text-blue-900" />
          <StatCard label="补资料" value={stats.supplement_count} color="bg-orange-50 text-orange-900" />
          <StatCard label="已完成" value={stats.completed_count} color="bg-green-50 text-green-900" />
          <StatCard label="已关闭" value={stats.closed_count} color="bg-purple-50 text-purple-900" />
        </div>
      )}

      <div className="card">
        <div className="card-header flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
          <div className="flex flex-wrap gap-2">
            {STATUS_FILTERS.map((f) => (
              <button
                key={f.value}
                onClick={() => setStatusFilter(f.value)}
                className={cn(
                  'px-3 py-1.5 rounded-md text-sm font-medium transition-colors',
                  statusFilter === f.value
                    ? 'bg-coffee-700 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                )}
              >
                {f.label}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-3">
            <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
              <input
                type="checkbox"
                checked={offlineOnly}
                onChange={(e) => setOfflineOnly(e.target.checked)}
                className="rounded border-gray-300 text-coffee-600 focus:ring-coffee-500"
              />
              <WifiOff className="w-4 h-4 text-red-500" />
              仅看离线异常
            </label>

            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="搜索单号/点位/设备"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="input pl-9 w-64"
              />
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">单据编号</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">门店点位</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">设备</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">来源</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">设备状态</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">状态</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">合格率</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">创建时间</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 bg-white">
              {loading ? (
                <tr>
                  <td colSpan={8} className="px-6 py-12 text-center text-gray-500">加载中...</td>
                </tr>
              ) : filteredRecords.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-6 py-12 text-center text-gray-500">暂无单据</td>
                </tr>
              ) : (
                filteredRecords.map((record) => (
                  <tr
                    key={record.id}
                    className="hover:bg-gray-50 cursor-pointer transition-colors"
                    onClick={() => navigate({ to: '/records/$recordId', params: { recordId: String(record.id) } })}
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-coffee-700">{record.record_no}</span>
                        {record.is_device_offline && !record.offline_handled && (
                          <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" title="设备离线异常" />
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">{record.store_point.name}</td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900">{record.device.device_name}</div>
                      <div className="text-xs text-gray-500">{record.device.device_code}</div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-700">
                      {SOURCE_CHANNEL_LABELS[record.source_channel]}
                    </td>
                    <td className="px-6 py-4">
                      <span className={cn('badge', DEVICE_STATUS_COLORS[record.device.status])}>
                        {DEVICE_STATUS_LABELS[record.device.status]}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <StatusBadge status={record.status} />
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      {record.qualified_rate != null ? `${record.qualified_rate}%` : '-'}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500">{formatDateTime(record.created_at)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

function StatCard({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className={cn('rounded-lg p-4 border border-gray-200', color)}>
      <div className="text-sm opacity-75">{label}</div>
      <div className="text-2xl font-bold mt-1">{value}</div>
    </div>
  )
}
