import { useEffect, useState } from 'react'
import { Link } from '@tanstack/react-router'
import {
  Users,
  Ticket,
  AlertTriangle,
  CalendarDays,
  TrendingUp,
  Clock,
  CheckCircle,
} from 'lucide-react'
import { statsApi, conflictApi, timeSlotApi } from '@/services/api'
import type { StatsSummary, ConflictRecord, TimeSlot } from '@/types'
import { formatDate, getConflictStatusColor, getConflictStatusLabel } from '@/utils'
import dayjs from 'dayjs'

export default function Dashboard() {
  const [stats, setStats] = useState<StatsSummary | null>(null)
  const [recentConflicts, setRecentConflicts] = useState<ConflictRecord[]>([])
  const [todaySlots, setTodaySlots] = useState<TimeSlot[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      setLoading(true)
      const [statsRes, conflictsRes, slotsRes] = await Promise.all([
        statsApi.getSummary(),
        conflictApi.getList({ page_size: 5, sort: 'detected_at' }),
        timeSlotApi.getList({
          start_date: dayjs().format('YYYY-MM-DD'),
          end_date: dayjs().format('YYYY-MM-DD'),
          is_active: true,
        }),
      ])
      setStats(statsRes)
      setRecentConflicts(conflictsRes.items)
      setTodaySlots(slotsRes)
    } catch (error) {
      console.error('加载数据失败:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">加载中...</div>
      </div>
    )
  }

  const statCards = [
    {
      label: '今日预约',
      value: stats?.today.reservations || 0,
      unit: '单',
      icon: Ticket,
      color: 'bg-blue-500',
      bgColor: 'bg-blue-50',
      textColor: 'text-blue-600',
    },
    {
      label: '今日游客',
      value: stats?.today.visitors || 0,
      unit: '人',
      icon: Users,
      color: 'bg-green-500',
      bgColor: 'bg-green-50',
      textColor: 'text-green-600',
    },
    {
      label: '已签到',
      value: stats?.today.checked_in || 0,
      unit: '人',
      icon: CheckCircle,
      color: 'bg-purple-500',
      bgColor: 'bg-purple-50',
      textColor: 'text-purple-600',
    },
    {
      label: '待处理冲突',
      value: stats?.pending_conflicts || 0,
      unit: '起',
      icon: AlertTriangle,
      color: 'bg-red-500',
      bgColor: 'bg-red-50',
      textColor: 'text-red-600',
    },
  ]

  return (
    <div className="space-y-6">
      {/* 页面标题 */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">工作台</h1>
        <p className="text-gray-500 mt-1">
          {formatDate(new Date(), 'YYYY年MM月DD日 dddd')}
        </p>
      </div>

      {/* 统计卡片 */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((card, index) => {
          const Icon = card.icon
          return (
            <div
              key={index}
              className={`${card.bgColor} rounded-xl p-4 lg:p-5`}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">{card.label}</p>
                  <div className="flex items-baseline mt-1">
                    <span className={`text-2xl lg:text-3xl font-bold ${card.textColor}`}>
                      {card.value}
                    </span>
                    <span className={`ml-1 text-sm ${card.textColor}`}>{card.unit}</span>
                  </div>
                </div>
                <div className={`${card.color} p-3 rounded-lg`}>
                  <Icon className="text-white" size={20} />
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* 手机端快捷入口 */}
      <div className="lg:hidden grid grid-cols-4 gap-3">
        <Link
          to="/reservations"
          className="flex flex-col items-center p-3 bg-white rounded-xl shadow-sm"
        >
          <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
            <Ticket className="text-blue-600" size={20} />
          </div>
          <span className="text-xs text-gray-600 mt-2">新增预约</span>
        </Link>
        <Link
          to="/reservations"
          className="flex flex-col items-center p-3 bg-white rounded-xl shadow-sm"
        >
          <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
            <CheckCircle className="text-green-600" size={20} />
          </div>
          <span className="text-xs text-gray-600 mt-2">快速签到</span>
        </Link>
        <Link
          to="/conflicts"
          className="flex flex-col items-center p-3 bg-white rounded-xl shadow-sm"
        >
          <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
            <AlertTriangle className="text-red-600" size={20} />
          </div>
          <span className="text-xs text-gray-600 mt-2">冲突处理</span>
        </Link>
        <Link
          to="/statistics"
          className="flex flex-col items-center p-3 bg-white rounded-xl shadow-sm"
        >
          <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
            <TrendingUp className="text-purple-600" size={20} />
          </div>
          <span className="text-xs text-gray-600 mt-2">数据统计</span>
        </Link>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* 今日时段 */}
        <div className="bg-white rounded-xl shadow-sm">
          <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900 flex items-center">
              <CalendarDays className="mr-2 text-primary-500" size={20} />
              今日时段
            </h2>
            <Link
              to="/time-slots"
              className="text-sm text-primary-600 hover:text-primary-700"
            >
              查看全部
            </Link>
          </div>
          <div className="p-4">
            {todaySlots.length === 0 ? (
              <div className="text-center py-8 text-gray-400">
                <Clock size={40} className="mx-auto mb-2 opacity-50" />
                <p>暂无时段</p>
              </div>
            ) : (
              <div className="space-y-3">
                {todaySlots.slice(0, 5).map((slot) => (
                  <div
                    key={slot.id}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                  >
                    <div className="flex items-center">
                      <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center">
                        <Clock className="text-primary-600" size={20} />
                      </div>
                      <div className="ml-3">
                        <p className="font-medium text-gray-900">
                          {slot.start_time} - {slot.end_time}
                        </p>
                        <p className="text-sm text-gray-500">
                          容量 {slot.capacity} 人
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-semibold text-primary-600">
                        {slot.remaining_capacity}
                      </p>
                      <p className="text-xs text-gray-500">剩余名额</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* 最近冲突 */}
        <div className="bg-white rounded-xl shadow-sm">
          <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900 flex items-center">
              <AlertTriangle className="mr-2 text-red-500" size={20} />
              最近冲突
            </h2>
            <Link
              to="/conflicts"
              className="text-sm text-primary-600 hover:text-primary-700"
            >
              查看全部
            </Link>
          </div>
          <div className="p-4">
            {recentConflicts.length === 0 ? (
              <div className="text-center py-8 text-gray-400">
                <CheckCircle size={40} className="mx-auto mb-2 opacity-50" />
                <p>暂无冲突记录</p>
              </div>
            ) : (
              <div className="space-y-3">
                {recentConflicts.map((conflict) => (
                  <Link
                    key={conflict.id}
                    to={`/conflicts/${conflict.id}`}
                    className="block p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="font-medium text-gray-900">
                          {conflict.conflict_no}
                        </p>
                        <p className="text-sm text-gray-500 mt-1 line-clamp-1">
                          {conflict.description}
                        </p>
                      </div>
                      <span
                        className={`px-2 py-1 text-xs rounded-full ${getConflictStatusColor(
                          conflict.status
                        )}`}
                      >
                        {getConflictStatusLabel(conflict.status)}
                      </span>
                    </div>
                    <p className="text-xs text-gray-400 mt-2">
                      {formatDate(conflict.detected_at, 'MM-DD HH:mm')}
                    </p>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
