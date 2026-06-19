import { useEffect, useState } from 'react'
import {
  Plus,
  CalendarDays,
  Clock,
  Users,
  Settings,
  ChevronLeft,
  ChevronRight,
  MoreHorizontal,
  AlertTriangle,
} from 'lucide-react'
import { timeSlotApi } from '@/services/api'
import type { TimeSlot, CapacityRule } from '@/types'
import { formatDate, cn } from '@/utils'
import dayjs from 'dayjs'

export default function TimeSlots() {
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([])
  const [selectedSlot, setSelectedSlot] = useState<TimeSlot | null>(null)
  const [capacityRules, setCapacityRules] = useState<CapacityRule[]>([])
  const [currentDate, setCurrentDate] = useState(dayjs())
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadTimeSlots()
  }, [currentDate])

  const loadTimeSlots = async () => {
    try {
      setLoading(true)
      const startOfMonth = currentDate.startOf('month').format('YYYY-MM-DD')
      const endOfMonth = currentDate.endOf('month').format('YYYY-MM-DD')
      const data = await timeSlotApi.getList({
        start_date: startOfMonth,
        end_date: endOfMonth,
      })
      setTimeSlots(data)
    } catch (error) {
      console.error('加载时段失败:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadCapacityRules = async (slotId: number) => {
    try {
      const data = await timeSlotApi.getCapacityRules(slotId)
      setCapacityRules(data)
    } catch (error) {
      console.error('加载容量规则失败:', error)
    }
  }

  const handleSelectSlot = (slot: TimeSlot) => {
    setSelectedSlot(slot)
    loadCapacityRules(slot.id)
  }

  const prevMonth = () => {
    setCurrentDate(currentDate.subtract(1, 'month'))
  }

  const nextMonth = () => {
    setCurrentDate(currentDate.add(1, 'month'))
  }

  const calendarDays = () => {
    const startOfMonth = currentDate.startOf('month')
    const endOfMonth = currentDate.endOf('month')
    const startDay = startOfMonth.day()
    const daysInMonth = endOfMonth.date()

    const days = []
    for (let i = 0; i < startDay; i++) {
      days.push(null)
    }
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(i)
    }
    return days
  }

  const getSlotsForDate = (day: number) => {
    const dateStr = currentDate.date(day).format('YYYY-MM-DD')
    return timeSlots.filter(
      (slot) => slot.date.slice(0, 10) === dateStr
    )
  }

  const weekDays = ['日', '一', '二', '三', '四', '五', '六']

  return (
    <div className="space-y-4">
      {/* 页面标题 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">时段管理</h1>
          <p className="text-gray-500 text-sm mt-1">
            共 {timeSlots.length} 个时段
          </p>
        </div>
        <button className="flex items-center px-4 py-2 bg-primary-500 text-white rounded-lg text-sm font-medium hover:bg-primary-600">
          <Plus size={16} className="mr-1.5" />
          新增时段
        </button>
      </div>

      <div className="grid lg:grid-cols-3 gap-4">
        {/* 日历视图 */}
        <div className="lg:col-span-2 bg-white rounded-xl shadow-sm">
          {/* 日历头部 */}
          <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900 flex items-center">
              <CalendarDays className="mr-2 text-primary-500" size={20} />
              日历视图
            </h2>
            <div className="flex items-center gap-2">
              <button
                onClick={prevMonth}
                className="p-1.5 hover:bg-gray-100 rounded-lg"
              >
                <ChevronLeft size={18} />
              </button>
              <span className="text-sm font-medium text-gray-700 min-w-24 text-center">
                {currentDate.format('YYYY年MM月')}
              </span>
              <button
                onClick={nextMonth}
                className="p-1.5 hover:bg-gray-100 rounded-lg"
              >
                <ChevronRight size={18} />
              </button>
            </div>
          </div>

          {/* 日历主体 */}
          <div className="p-4">
            {/* 星期标题 */}
            <div className="grid grid-cols-7 gap-1 mb-2">
              {weekDays.map((day) => (
                <div
                  key={day}
                  className="text-center text-xs font-medium text-gray-500 py-2"
                >
                  {day}
                </div>
              ))}
            </div>

            {/* 日期网格 */}
            <div className="grid grid-cols-7 gap-1">
              {calendarDays().map((day, index) => {
                if (day === null) {
                  return <div key={`empty-${index}`} className="h-20" />
                }

                const daySlots = getSlotsForDate(day)
                const totalCapacity = daySlots.reduce(
                  (sum, s) => sum + s.capacity,
                  0
                )
                const totalRemaining = daySlots.reduce(
                  (sum, s) => sum + s.remaining_capacity,
                  0
                )
                const hasConflict = daySlots.some(
                  (s) => s.remaining_capacity < 0
                )

                return (
                  <div
                    key={day}
                    className={cn(
                      'h-20 p-1.5 border rounded-lg cursor-pointer transition-colors',
                      daySlots.length > 0
                        ? 'border-primary-200 bg-primary-50 hover:bg-primary-100'
                        : 'border-gray-100 hover:border-gray-200'
                    )}
                    onClick={() => daySlots.length > 0 && setSelectedSlot(daySlots[0])}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-medium text-gray-700">
                        {day}
                      </span>
                      {hasConflict && (
                        <AlertTriangle
                          size={12}
                          className="text-red-500"
                        />
                      )}
                    </div>
                    {daySlots.length > 0 && (
                      <div className="mt-1 space-y-0.5">
                        {daySlots.slice(0, 2).map((slot) => (
                          <div
                            key={slot.id}
                            className="text-[10px] text-gray-600 truncate"
                          >
                            {slot.start_time} 剩{slot.remaining_capacity}
                          </div>
                        ))}
                        {daySlots.length > 2 && (
                          <div className="text-[10px] text-gray-400">
                            +{daySlots.length - 2} 个时段
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        </div>

        {/* 时段详情和容量规则 */}
        <div className="space-y-4">
          {/* 时段详情 */}
          <div className="bg-white rounded-xl shadow-sm">
            <div className="px-5 py-4 border-b border-gray-100">
              <h2 className="text-lg font-semibold text-gray-900 flex items-center">
                <Clock className="mr-2 text-primary-500" size={20} />
                时段详情
              </h2>
            </div>
            <div className="p-4">
              {selectedSlot ? (
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <p className="font-medium text-gray-900">
                        {selectedSlot.start_time} - {selectedSlot.end_time}
                      </p>
                      <p className="text-sm text-gray-500">
                        {formatDate(selectedSlot.date)}
                      </p>
                    </div>
                    <button className="p-1.5 text-gray-400 hover:text-gray-600">
                      <MoreHorizontal size={18} />
                    </button>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="p-3 bg-blue-50 rounded-lg">
                      <p className="text-xs text-blue-600">总容量</p>
                      <p className="text-xl font-bold text-blue-700">
                        {selectedSlot.capacity}
                      </p>
                    </div>
                    <div className="p-3 bg-green-50 rounded-lg">
                      <p className="text-xs text-green-600">剩余</p>
                      <p className="text-xl font-bold text-green-700">
                        {selectedSlot.remaining_capacity}
                      </p>
                    </div>
                  </div>

                  {selectedSlot.description && (
                    <p className="text-sm text-gray-600">
                      {selectedSlot.description}
                    </p>
                  )}

                  <div className="flex items-center gap-2">
                    <span
                      className={cn(
                        'px-2 py-0.5 text-xs rounded-full',
                        selectedSlot.is_active
                          ? 'bg-green-100 text-green-700'
                          : 'bg-gray-100 text-gray-600'
                      )}
                    >
                      {selectedSlot.is_active ? '启用' : '停用'}
                    </span>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8 text-gray-400">
                  <CalendarDays size={32} className="mx-auto mb-2 opacity-50" />
                  <p className="text-sm">请选择一个时段</p>
                </div>
              )}
            </div>
          </div>

          {/* 容量规则 */}
          <div className="bg-white rounded-xl shadow-sm">
            <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900 flex items-center">
                <Settings className="mr-2 text-primary-500" size={20} />
                容量规则
              </h2>
              <button className="text-sm text-primary-600 hover:text-primary-700">
                添加
              </button>
            </div>
            <div className="p-4">
              {!selectedSlot ? (
                <div className="text-center py-6 text-gray-400">
                  <p className="text-sm">请先选择时段</p>
                </div>
              ) : capacityRules.length === 0 ? (
                <div className="text-center py-6 text-gray-400">
                  <p className="text-sm">暂无容量规则</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {capacityRules.map((rule) => (
                    <div
                      key={rule.id}
                      className="p-3 bg-gray-50 rounded-lg"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-medium text-gray-900 text-sm">
                          {rule.rule_type}
                        </span>
                        <span className="text-xs text-gray-500">
                          优先级 {rule.priority}
                        </span>
                      </div>
                      {rule.description && (
                        <p className="text-xs text-gray-500 mt-1">
                          {rule.description}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 时段列表 - 手机端 */}
      <div className="lg:hidden bg-white rounded-xl shadow-sm">
        <div className="px-5 py-4 border-b border-gray-100">
          <h2 className="text-lg font-semibold text-gray-900">时段列表</h2>
        </div>
        <div className="divide-y divide-gray-100">
          {timeSlots.map((slot) => (
            <div
              key={slot.id}
              className="p-4 flex items-center justify-between"
              onClick={() => handleSelectSlot(slot)}
            >
              <div className="flex items-center">
                <div className="w-10 h-10 bg-primary-100 rounded-lg flex items-center justify-center">
                  <Clock className="text-primary-600" size={18} />
                </div>
                <div className="ml-3">
                  <p className="font-medium text-gray-900">
                    {slot.start_time} - {slot.end_time}
                  </p>
                  <p className="text-xs text-gray-500">
                    {formatDate(slot.date)}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm font-medium text-gray-900">
                  {slot.remaining_capacity}/{slot.capacity}
                </p>
                <p className="text-xs text-gray-500">剩余/总容量</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
