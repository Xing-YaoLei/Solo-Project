import { useEffect, useState } from 'react'
import { Link } from '@tanstack/react-router'
import {
  AlertTriangle,
  Search,
  Filter,
  User,
  Clock,
  ChevronRight,
  Play,
  CheckCircle,
  RefreshCw,
  Users,
  MessageSquare,
} from 'lucide-react'
import { conflictApi } from '@/services/api'
import type { ConflictRecord } from '@/types'
import {
  formatDateTime,
  getConflictStatusLabel,
  getConflictStatusColor,
  getSeverityLabel,
  getSeverityColor,
  cn,
} from '@/utils'

const statusOptions = [
  { value: '', label: '全部状态' },
  { value: 'detected', label: '已检测' },
  { value: 'assigned', label: '已分配' },
  { value: 'in_progress', label: '处理中' },
  { value: 'resolved', label: '已解决' },
  { value: 'closed', label: '已关闭' },
]

export default function Conflicts() {
  const [conflicts, setConflicts] = useState<ConflictRecord[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [pageSize] = useState(20)
  const [loading, setLoading] = useState(false)
  const [showFilter, setShowFilter] = useState(false)
  const [statusFilter, setStatusFilter] = useState('')
  const [detecting, setDetecting] = useState(false)

  useEffect(() => {
    loadConflicts()
  }, [page, statusFilter])

  const loadConflicts = async () => {
    try {
      setLoading(true)
      const params: any = {
        page,
        page_size: pageSize,
      }
      if (statusFilter) params.status = statusFilter

      const data = await conflictApi.getList(params)
      setConflicts(data.items)
      setTotal(data.total)
    } catch (error) {
      console.error('加载冲突列表失败:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleDetect = async () => {
    try {
      setDetecting(true)
      const result = await conflictApi.detect()
      alert(`检测完成，发现 ${result.conflicts_found} 个新冲突`)
      loadConflicts()
    } catch (error) {
      console.error('冲突检测失败:', error)
    } finally {
      setDetecting(false)
    }
  }

  const totalPages = Math.ceil(total / pageSize)

  const stats = [
    { label: '待处理', value: conflicts.filter(c => ['detected', 'assigned'].includes(c.status)).length, color: 'text-red-600', bg: 'bg-red-50' },
    { label: '处理中', value: conflicts.filter(c => c.status === 'in_progress').length, color: 'text-yellow-600', bg: 'bg-yellow-50' },
    { label: '已解决', value: conflicts.filter(c => c.status === 'resolved').length, color: 'text-green-600', bg: 'bg-green-50' },
  ]

  return (
    <div className="space-y-4">
      {/* 页面标题和操作栏 */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">冲突处理</h1>
          <p className="text-gray-500 text-sm mt-1">共 {total} 条记录</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowFilter(!showFilter)}
            className={cn(
              'flex items-center px-3 py-2 rounded-lg text-sm font-medium transition-colors',
              showFilter
                ? 'bg-primary-100 text-primary-700'
                : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-200'
            )}
          >
            <Filter size={16} className="mr-1.5" />
            筛选
          </button>
          <button
            onClick={handleDetect}
            disabled={detecting}
            className="flex items-center px-3 py-2 bg-red-500 text-white rounded-lg text-sm font-medium hover:bg-red-600 disabled:opacity-50"
          >
            <RefreshCw size={16} className={cn('mr-1.5', detecting && 'animate-spin')} />
            检测冲突
          </button>
        </div>
      </div>

      {/* 统计卡片 */}
      <div className="grid grid-cols-3 gap-3">
        {stats.map((stat, index) => (
          <div key={index} className={`${stat.bg} rounded-xl p-4`}>
            <p className="text-sm text-gray-600">{stat.label}</p>
            <p className={`text-2xl font-bold ${stat.color} mt-1`}>{stat.value}</p>
          </div>
        ))}
      </div>

      {/* 筛选面板 */}
      {showFilter && (
        <div className="bg-white rounded-xl shadow-sm p-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                冲突状态
              </label>
              <select
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value)
                  setPage(1)
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              >
                {statusOptions.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      )}

      {/* 冲突列表 - 桌面端 */}
      <div className="hidden lg:block bg-white rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  冲突编号
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  类型
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  严重程度
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  受影响数量
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  状态
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  处理人
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  检测时间
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  操作
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {conflicts.map((conflict) => (
                <tr
                  key={conflict.id}
                  className="hover:bg-gray-50 cursor-pointer"
                >
                  <td className="px-4 py-3">
                    <Link
                      to={`/conflicts/${conflict.id}`}
                      className="font-medium text-primary-600 hover:underline"
                    >
                      {conflict.conflict_no}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-900">
                    {conflict.conflict_type === 'over_capacity'
                      ? '容量超限'
                      : conflict.conflict_type}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={cn(
                        'px-2 py-1 text-xs font-medium rounded-full',
                        getSeverityColor(conflict.severity)
                      )}
                    >
                      {getSeverityLabel(conflict.severity)}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600">
                    {conflict.affected_objects?.length || 0} 个预约
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={cn(
                        'px-2 py-1 text-xs font-medium rounded-full',
                        getConflictStatusColor(conflict.status)
                      )}
                    >
                      {getConflictStatusLabel(conflict.status)}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    {conflict.assignee ? (
                      <div className="flex items-center">
                        <div className="w-6 h-6 bg-gray-200 rounded-full flex items-center justify-center">
                          <User size={12} className="text-gray-500" />
                        </div>
                        <span className="ml-2 text-sm text-gray-700">
                          {conflict.assignee.full_name || conflict.assignee.username}
                        </span>
                      </div>
                    ) : (
                      <span className="text-sm text-gray-400">未分配</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-500">
                    {formatDateTime(conflict.detected_at)}
                  </td>
                  <td className="px-4 py-3">
                    <Link
                      to={`/conflicts/${conflict.id}`}
                      className="text-sm text-primary-600 hover:text-primary-700 flex items-center"
                    >
                      详情
                      <ChevronRight size={14} className="ml-0.5" />
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* 分页 */}
        <div className="px-4 py-3 border-t border-gray-100 flex items-center justify-between">
          <p className="text-sm text-gray-500">
            第 {page} / {totalPages || 1} 页，共 {total} 条
          </p>
        </div>
      </div>

      {/* 冲突列表 - 手机端卡片 */}
      <div className="lg:hidden space-y-3">
        {conflicts.map((conflict) => (
          <Link
            key={conflict.id}
            to={`/conflicts/${conflict.id}`}
            className="block bg-white rounded-xl shadow-sm p-4"
          >
            <div className="flex items-start justify-between">
              <div className="flex items-center">
                <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
                  <AlertTriangle className="text-red-600" size={18} />
                </div>
                <div className="ml-3">
                  <p className="font-medium text-gray-900">
                    {conflict.conflict_no}
                  </p>
                  <p className="text-xs text-gray-500">
                    {conflict.conflict_type === 'over_capacity'
                      ? '容量超限'
                      : conflict.conflict_type}
                  </p>
                </div>
              </div>
              <span
                className={cn(
                  'px-2 py-0.5 text-xs font-medium rounded-full',
                  getConflictStatusColor(conflict.status)
                )}
              >
                {getConflictStatusLabel(conflict.status)}
              </span>
            </div>
            {conflict.description && (
              <p className="mt-3 text-sm text-gray-600 line-clamp-2">
                {conflict.description}
              </p>
            )}
            <div className="mt-3 flex items-center justify-between text-xs text-gray-500">
              <span className="flex items-center">
                <Users size={12} className="mr-1" />
                影响 {conflict.affected_objects?.length || 0} 个预约
              </span>
              <span className="flex items-center">
                <Clock size={12} className="mr-1" />
                {formatDateTime(conflict.detected_at)}
              </span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}
