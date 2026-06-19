import { useEffect, useState } from 'react'
import {
  BarChart3,
  TrendingUp,
  Users,
  CheckCircle,
  XCircle,
  Clock,
  CalendarDays,
  Download,
} from 'lucide-react'
import { statsApi } from '@/services/api'
import type { AttendanceStats, StatsSummary } from '@/types'
import { cn, exportToCSV } from '@/utils'
import dayjs from 'dayjs'

export default function Statistics() {
  const [summary, setSummary] = useState<StatsSummary | null>(null)
  const [attendanceData, setAttendanceData] = useState<AttendanceStats[]>([])
  const [loading, setLoading] = useState(true)
  const [dateRange, setDateRange] = useState('7d')

  useEffect(() => {
    loadData()
  }, [dateRange])

  const loadData = async () => {
    try {
      setLoading(true)
      let start_date, end_date

      switch (dateRange) {
        case '7d':
          start_date = dayjs().subtract(6, 'day').format('YYYY-MM-DD')
          end_date = dayjs().format('YYYY-MM-DD')
          break
        case '30d':
          start_date = dayjs().subtract(29, 'day').format('YYYY-MM-DD')
          end_date = dayjs().format('YYYY-MM-DD')
          break
        case 'thisMonth':
          start_date = dayjs().startOf('month').format('YYYY-MM-DD')
          end_date = dayjs().format('YYYY-MM-DD')
          break
        default:
          start_date = dayjs().subtract(6, 'day').format('YYYY-MM-DD')
          end_date = dayjs().format('YYYY-MM-DD')
      }

      const [summaryRes, attendanceRes] = await Promise.all([
        statsApi.getSummary(),
        statsApi.getAttendance({ start_date, end_date }),
      ])
      setSummary(summaryRes)
      setAttendanceData(attendanceRes)
    } catch (error) {
      console.error('加载统计数据失败:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleExport = async () => {
    try {
      let start_date, end_date

      switch (dateRange) {
        case '7d':
          start_date = dayjs().subtract(6, 'day').format('YYYY-MM-DD')
          end_date = dayjs().format('YYYY-MM-DD')
          break
        case '30d':
          start_date = dayjs().subtract(29, 'day').format('YYYY-MM-DD')
          end_date = dayjs().format('YYYY-MM-DD')
          break
        case 'thisMonth':
          start_date = dayjs().startOf('month').format('YYYY-MM-DD')
          end_date = dayjs().format('YYYY-MM-DD')
          break
        default:
          start_date = dayjs().subtract(6, 'day').format('YYYY-MM-DD')
          end_date = dayjs().format('YYYY-MM-DD')
      }

      const result = await statsApi.export({ start_date, end_date })
      exportToCSV(result.data, result.filename)
    } catch (error) {
      console.error('导出统计数据失败:', error)
      alert('导出失败，请重试')
    }
  }

  const maxRate = Math.max(...attendanceData.map((d) => d.check_in_rate), 1)
  const maxVisitors = Math.max(
    ...attendanceData.map((d) => d.total_visitors),
    1
  )

  const dateRangeOptions = [
    { value: '7d', label: '近7天' },
    { value: '30d', label: '近30天' },
    { value: 'thisMonth', label: '本月' },
  ]

  const totalStats = {
    totalReservations: attendanceData.reduce(
      (sum, d) => sum + d.total_reservations,
      0
    ),
    totalVisitors: attendanceData.reduce(
      (sum, d) => sum + d.total_visitors,
      0
    ),
    totalCheckedIn: attendanceData.reduce((sum, d) => sum + d.checked_in, 0),
    totalCancelled: attendanceData.reduce((sum, d) => sum + d.cancelled, 0),
    avgCheckInRate:
      attendanceData.length > 0
        ? attendanceData.reduce((sum, d) => sum + d.check_in_rate, 0) /
          attendanceData.length
        : 0,
  }

  return (
    <div className="space-y-4">
      {/* 页面标题 */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">数据统计</h1>
          <p className="text-gray-500 text-sm mt-1">到场率分析与预约数据</p>
        </div>
        <button
          onClick={handleExport}
          className="hidden sm:flex items-center px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50"
        >
          <Download size={16} className="mr-1.5" />
          导出报表
        </button>
      </div>

      {/* 日期选择 */}
      <div className="bg-white rounded-xl shadow-sm p-4">
        <div className="flex items-center gap-2 overflow-x-auto">
          {dateRangeOptions.map((opt) => (
            <button
              key={opt.value}
              onClick={() => setDateRange(opt.value)}
              className={cn(
                'px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors',
                dateRange === opt.value
                  ? 'bg-primary-500 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              )}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* 核心指标卡片 */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl shadow-sm p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">预约总数</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">
                {totalStats.totalReservations}
              </p>
            </div>
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <CalendarDays className="text-blue-600" size={20} />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">游客总数</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">
                {totalStats.totalVisitors}
              </p>
            </div>
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
              <Users className="text-green-600" size={20} />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">平均到场率</p>
              <p className="text-2xl font-bold text-green-600 mt-1">
                {(totalStats.avgCheckInRate * 100).toFixed(1)}%
              </p>
            </div>
            <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
              <TrendingUp className="text-purple-600" size={20} />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">取消数</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">
                {totalStats.totalCancelled}
              </p>
            </div>
            <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
              <XCircle className="text-red-600" size={20} />
            </div>
          </div>
        </div>
      </div>

      {/* 到场率趋势图 */}
      <div className="bg-white rounded-xl shadow-sm">
        <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900 flex items-center">
            <BarChart3 className="mr-2 text-primary-500" size={20} />
            到场率趋势
          </h2>
          <button
            onClick={handleExport}
            className="sm:hidden flex items-center px-3 py-1.5 text-sm text-primary-600 hover:text-primary-700"
          >
            <Download size={14} className="mr-1" />
            导出
          </button>
        </div>
        <div className="p-5">
          {loading ? (
            <div className="h-64 flex items-center justify-center">
              <div className="text-gray-500">加载中...</div>
            </div>
          ) : (
            <div className="h-64 flex items-end gap-2">
              {attendanceData.map((day, index) => (
                <div key={index} className="flex-1 flex flex-col items-center">
                  <div
                    className="w-full bg-primary-500 rounded-t-lg transition-all hover:bg-primary-600 relative group cursor-pointer"
                    style={{
                      height: `${(day.check_in_rate / maxRate) * 180}px`,
                      minHeight: '4px',
                    }}
                  >
                    <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-gray-900 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                      到场率 {(day.check_in_rate * 100).toFixed(1)}%
                    </div>
                  </div>
                  <p className="text-xs text-gray-500 mt-2">
                    {day.date.slice(5)}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* 游客人数趋势 */}
      <div className="bg-white rounded-xl shadow-sm">
        <div className="px-5 py-4 border-b border-gray-100">
          <h2 className="text-lg font-semibold text-gray-900 flex items-center">
            <Users className="mr-2 text-green-500" size={20} />
            游客人数趋势
          </h2>
        </div>
        <div className="p-5">
          {loading ? (
            <div className="h-48 flex items-center justify-center">
              <div className="text-gray-500">加载中...</div>
            </div>
          ) : (
            <div className="h-48 flex items-end gap-2">
              {attendanceData.map((day, index) => (
                <div key={index} className="flex-1 flex flex-col items-center">
                  <div className="w-full h-6 bg-gray-100 rounded overflow-hidden">
                    <div
                      className="h-full bg-green-500 transition-all"
                      style={{
                        width: `${(day.total_visitors / maxVisitors) * 100}%`,
                      }}
                    />
                  </div>
                  <div className="flex items-center justify-between w-full mt-1">
                    <span className="text-xs text-gray-500">
                      {day.total_visitors}人
                    </span>
                    <span className="text-xs text-green-600">
                      {day.checked_in}到
                    </span>
                  </div>
                  <p className="text-xs text-gray-400 mt-1">
                    {day.date.slice(5)}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* 详细数据表 - 仅桌面端显示 */}
      <div className="hidden lg:block bg-white rounded-xl shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100">
          <h2 className="text-lg font-semibold text-gray-900">详细数据</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  日期
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  预约数
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  游客数
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  已签到
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  到场率
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  已取消
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  待处理
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {attendanceData.map((day, index) => (
                <tr key={index} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-sm text-gray-900">
                    {day.date}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600">
                    {day.total_reservations}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600">
                    {day.total_visitors}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600">
                    <span className="text-green-600 font-medium">
                      {day.checked_in}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center">
                      <div className="w-20 h-2 bg-gray-200 rounded-full overflow-hidden mr-2">
                        <div
                          className="h-full bg-green-500"
                          style={{ width: `${day.check_in_rate * 100}%` }}
                        />
                      </div>
                      <span className="text-sm text-gray-700">
                        {(day.check_in_rate * 100).toFixed(1)}%
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm text-red-600">
                    {day.cancelled}
                  </td>
                  <td className="px-4 py-3 text-sm text-yellow-600">
                    {day.pending}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
