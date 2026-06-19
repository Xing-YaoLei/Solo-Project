import { useEffect, useState, useMemo } from 'react'
import { Link, useNavigate } from '@tanstack/react-router'
import {
  Plus,
  Search,
  Filter,
  Download,
  CheckSquare,
  Square,
  ChevronLeft,
  ChevronRight,
  Ticket,
  Phone,
  Users,
  MoreHorizontal,
  Check,
  X,
} from 'lucide-react'
import { reservationApi } from '@/services/api'
import type { Reservation } from '@/types'
import {
  formatDateTime,
  getStatusLabel,
  getStatusColor,
  cn,
} from '@/utils'

const statusOptions = [
  { value: '', label: '全部状态' },
  { value: 'pending', label: '待确认' },
  { value: 'confirmed', label: '已确认' },
  { value: 'checked_in', label: '已签到' },
  { value: 'cancelled', label: '已取消' },
  { value: 'rescheduled', label: '已改约' },
  { value: 'conflict', label: '有冲突' },
]

export default function Reservations() {
  const navigate = useNavigate()
  const [reservations, setReservations] = useState<Reservation[]>([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [pageSize] = useState(20)
  const [loading, setLoading] = useState(false)
  const [showFilter, setShowFilter] = useState(false)
  const [selectedIds, setSelectedIds] = useState<number[]>([])
  const [filters, setFilters] = useState({
    status: '',
    visitor_name: '',
    visitor_phone: '',
    start_date: '',
    end_date: '',
  })

  const loadReservations = async () => {
    try {
      setLoading(true)
      const params: any = {
        page,
        page_size: pageSize,
      }
      if (filters.status) params.status = filters.status
      if (filters.visitor_name) params.visitor_name = filters.visitor_name
      if (filters.visitor_phone) params.visitor_phone = filters.visitor_phone
      if (filters.start_date) params.start_date = filters.start_date
      if (filters.end_date) params.end_date = filters.end_date

      const data = await reservationApi.getList(params)
      setReservations(data.items)
      setTotal(data.total)
    } catch (error) {
      console.error('加载预约列表失败:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadReservations()
  }, [page, filters.status])

  const totalPages = Math.ceil(total / pageSize)

  const toggleSelect = (id: number) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    )
  }

  const toggleSelectAll = () => {
    if (selectedIds.length === reservations.length) {
      setSelectedIds([])
    } else {
      setSelectedIds(reservations.map((r) => r.id))
    }
  }

  const handleBatchCancel = async () => {
    if (!confirm(`确定要取消选中的 ${selectedIds.length} 条预约吗？`)) return
    try {
      await reservationApi.batchOperation('cancel', selectedIds)
      setSelectedIds([])
      loadReservations()
    } catch (error) {
      console.error('批量取消失败:', error)
    }
  }

  const handleBatchConfirm = async () => {
    try {
      await reservationApi.batchOperation('confirm', selectedIds)
      setSelectedIds([])
      loadReservations()
    } catch (error) {
      console.error('批量确认失败:', error)
    }
  }

  const handleCheckIn = async (id: number) => {
    try {
      await reservationApi.checkIn(id)
      loadReservations()
    } catch (error) {
      console.error('签到失败:', error)
    }
  }

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    setPage(1)
    loadReservations()
  }

  return (
    <div className="space-y-4">
      {/* 页面标题和操作栏 */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">预约管理</h1>
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
          <Link
            to="/reservations"
            className="hidden sm:flex items-center px-3 py-2 bg-white border border-gray-200 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            <Download size={16} className="mr-1.5" />
            导出
          </Link>
          <button
            onClick={() => {}}
            className="flex items-center px-4 py-2 bg-primary-500 text-white rounded-lg text-sm font-medium hover:bg-primary-600 transition-colors"
          >
            <Plus size={16} className="mr-1.5" />
            新增预约
          </button>
        </div>
      </div>

      {/* 筛选面板 */}
      {showFilter && (
        <div className="bg-white rounded-xl shadow-sm p-4">
          <form onSubmit={handleSearch} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                游客姓名
              </label>
              <input
                type="text"
                value={filters.visitor_name}
                onChange={(e) =>
                  setFilters({ ...filters, visitor_name: e.target.value })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                placeholder="请输入游客姓名"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                联系电话
              </label>
              <input
                type="text"
                value={filters.visitor_phone}
                onChange={(e) =>
                  setFilters({ ...filters, visitor_phone: e.target.value })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                placeholder="请输入联系电话"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                预约状态
              </label>
              <select
                value={filters.status}
                onChange={(e) =>
                  setFilters({ ...filters, status: e.target.value })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              >
                {statusOptions.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                预约日期
              </label>
              <div className="flex gap-2">
                <input
                  type="date"
                  value={filters.start_date}
                  onChange={(e) =>
                    setFilters({ ...filters, start_date: e.target.value })
                  }
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent text-sm"
                />
                <input
                  type="date"
                  value={filters.end_date}
                  onChange={(e) =>
                    setFilters({ ...filters, end_date: e.target.value })
                  }
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent text-sm"
                />
              </div>
            </div>
          </form>
          <div className="flex justify-end mt-4 gap-2">
            <button
              type="button"
              onClick={() => {
                setFilters({
                  status: '',
                  visitor_name: '',
                  visitor_phone: '',
                  start_date: '',
                  end_date: '',
                })
                setPage(1)
              }}
              className="px-4 py-2 text-gray-600 hover:text-gray-800 text-sm"
            >
              重置
            </button>
            <button
              type="button"
              onClick={handleSearch}
              className="px-4 py-2 bg-primary-500 text-white rounded-lg text-sm font-medium hover:bg-primary-600"
            >
              查询
            </button>
          </div>
        </div>
      )}

      {/* 批量操作栏 */}
      {selectedIds.length > 0 && (
        <div className="bg-primary-50 rounded-xl p-3 flex items-center justify-between">
          <span className="text-sm text-primary-700">
            已选择 {selectedIds.length} 条记录
          </span>
          <div className="flex gap-2">
            <button
              onClick={handleBatchConfirm}
              className="flex items-center px-3 py-1.5 bg-white border border-primary-200 text-primary-600 rounded-lg text-sm hover:bg-primary-50"
            >
              <Check size={14} className="mr-1" />
              批量确认
            </button>
            <button
              onClick={handleBatchCancel}
              className="flex items-center px-3 py-1.5 bg-white border border-red-200 text-red-600 rounded-lg text-sm hover:bg-red-50"
            >
              <X size={14} className="mr-1" />
              批量取消
            </button>
          </div>
        </div>
      )}

      {/* 预约列表 - 桌面端表格 */}
      <div className="hidden lg:block bg-white rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="w-12 px-4 py-3 text-left">
                  <button onClick={toggleSelectAll}>
                    {selectedIds.length === reservations.length &&
                    reservations.length > 0 ? (
                      <CheckSquare className="text-primary-500" size={18} />
                    ) : (
                      <Square className="text-gray-400" size={18} />
                    )}
                  </button>
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  预约单号
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  游客信息
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  时段
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  人数
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  状态
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  创建时间
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  操作
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {reservations.map((reservation) => (
                <tr
                  key={reservation.id}
                  className="hover:bg-gray-50 cursor-pointer"
                  onClick={() =>
                    navigate({ to: `/reservations/${reservation.id}` })
                  }
                >
                  <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                    <button onClick={() => toggleSelect(reservation.id)}>
                      {selectedIds.includes(reservation.id) ? (
                        <CheckSquare className="text-primary-500" size={18} />
                      ) : (
                        <Square className="text-gray-300" size={18} />
                      )}
                    </button>
                  </td>
                  <td className="px-4 py-3">
                    <span className="font-medium text-primary-600">
                      {reservation.reservation_no}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center">
                      <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
                        <Users size={14} className="text-gray-500" />
                      </div>
                      <div className="ml-3">
                        <p className="text-sm font-medium text-gray-900">
                          {reservation.visitor_name}
                        </p>
                        <p className="text-xs text-gray-500 flex items-center">
                          <Phone size={10} className="mr-1" />
                          {reservation.visitor_phone}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600">
                    {reservation.time_slot
                      ? `${reservation.time_slot.date.slice(0, 10)} ${reservation.time_slot.start_time}-${reservation.time_slot.end_time}`
                      : '-'}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600">
                    {reservation.visitor_count} 人
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={cn(
                        'px-2 py-1 text-xs font-medium rounded-full',
                        getStatusColor(reservation.status)
                      )}
                    >
                      {getStatusLabel(reservation.status)}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-500">
                    {formatDateTime(reservation.created_at)}
                  </td>
                  <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                    <div className="flex items-center gap-1">
                      {reservation.status === 'confirmed' && (
                        <button
                          onClick={() => handleCheckIn(reservation.id)}
                          className="px-2 py-1 text-xs text-green-600 bg-green-50 rounded hover:bg-green-100"
                        >
                          签到
                        </button>
                      )}
                      <button className="p-1 text-gray-400 hover:text-gray-600">
                        <MoreHorizontal size={16} />
                      </button>
                    </div>
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
          <div className="flex items-center gap-1">
            <button
              onClick={() => setPage(Math.max(1, page - 1))}
              disabled={page <= 1}
              className="p-2 rounded-lg hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronLeft size={18} />
            </button>
            <button
              onClick={() => setPage(Math.min(totalPages, page + 1))}
              disabled={page >= totalPages}
              className="p-2 rounded-lg hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronRight size={18} />
            </button>
          </div>
        </div>
      </div>

      {/* 预约列表 - 手机端卡片 */}
      <div className="lg:hidden space-y-3">
        {reservations.map((reservation) => (
          <div
            key={reservation.id}
            className="bg-white rounded-xl shadow-sm p-4"
            onClick={() => navigate({ to: `/reservations/${reservation.id}` })}
          >
            <div className="flex items-start justify-between">
              <div className="flex items-center">
                <div className="w-10 h-10 bg-primary-100 rounded-lg flex items-center justify-center">
                  <Ticket className="text-primary-600" size={18} />
                </div>
                <div className="ml-3">
                  <p className="font-medium text-gray-900">
                    {reservation.visitor_name}
                  </p>
                  <p className="text-xs text-gray-500">
                    {reservation.reservation_no}
                  </p>
                </div>
              </div>
              <span
                className={cn(
                  'px-2 py-0.5 text-xs font-medium rounded-full',
                  getStatusColor(reservation.status)
                )}
              >
                {getStatusLabel(reservation.status)}
              </span>
            </div>
            <div className="mt-3 grid grid-cols-2 gap-2 text-sm">
              <div className="flex items-center text-gray-500">
                <Users size={14} className="mr-1.5" />
                {reservation.visitor_count} 人
              </div>
              <div className="flex items-center text-gray-500">
                <Phone size={14} className="mr-1.5" />
                {reservation.visitor_phone}
              </div>
            </div>
            <div className="mt-3 pt-3 border-t border-gray-100 text-xs text-gray-400">
              {reservation.time_slot
                ? `${reservation.time_slot.date.slice(0, 10)} ${reservation.time_slot.start_time}-${reservation.time_slot.end_time}`
                : ''}
            </div>
          </div>
        ))}

        {/* 移动端分页 */}
        <div className="flex items-center justify-center gap-4 py-4">
          <button
            onClick={() => setPage(Math.max(1, page - 1))}
            disabled={page <= 1}
            className="flex items-center px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm disabled:opacity-50"
          >
            <ChevronLeft size={16} className="mr-1" />
            上一页
          </button>
          <span className="text-sm text-gray-500">
            {page} / {totalPages || 1}
          </span>
          <button
            onClick={() => setPage(Math.min(totalPages, page + 1))}
            disabled={page >= totalPages}
            className="flex items-center px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm disabled:opacity-50"
          >
            下一页
            <ChevronRight size={16} className="ml-1" />
          </button>
        </div>
      </div>
    </div>
  )
}
