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
  XCircle,
  Trash2,
  Edit,
} from 'lucide-react'
import { timeSlotApi } from '@/services/api'
import type { TimeSlot, CapacityRule } from '@/types'
import { formatDate, cn } from '@/utils'
import dayjs from 'dayjs'

const ruleTypeOptions = [
  { value: 'max_per_group', label: '团体最大人数' },
  { value: 'min_advance_hours', label: '最少提前预约小时数' },
  { value: 'max_advance_days', label: '最多提前预约天数' },
  { value: 'blacklist_weekday', label: '周几不可预约' },
  { value: 'special_discount', label: '特殊折扣' },
  { value: 'custom', label: '自定义规则' },
]

export default function TimeSlots() {
  const [timeSlots, setTimeSlots] = useState<TimeSlot[]>([])
  const [selectedSlot, setSelectedSlot] = useState<TimeSlot | null>(null)
  const [capacityRules, setCapacityRules] = useState<CapacityRule[]>([])
  const [currentDate, setCurrentDate] = useState(dayjs())
  const [loading, setLoading] = useState(true)
  const [showCreateSlot, setShowCreateSlot] = useState(false)
  const [showCreateRule, setShowCreateRule] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [slotForm, setSlotForm] = useState({
    date: dayjs().format('YYYY-MM-DD'),
    start_time: '09:00',
    end_time: '11:00',
    capacity: 100,
    is_active: true,
    description: '',
  })
  const [ruleForm, setRuleForm] = useState({
    rule_type: 'max_per_group',
    rule_value: '',
    priority: 0,
    description: '',
  })
  const [slotErrors, setSlotErrors] = useState<Record<string, string>>({})
  const [ruleErrors, setRuleErrors] = useState<Record<string, string>>({})

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

  const validateSlotForm = () => {
    const errors: Record<string, string> = {}
    if (!slotForm.date) errors.date = '请选择日期'
    if (!slotForm.start_time) errors.start_time = '请选择开始时间'
    if (!slotForm.end_time) errors.end_time = '请选择结束时间'
    if (slotForm.start_time >= slotForm.end_time) errors.end_time = '结束时间必须晚于开始时间'
    if (slotForm.capacity < 1) errors.capacity = '容量至少为1'
    setSlotErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handleCreateSlot = async () => {
    if (!validateSlotForm()) return
    try {
      setSubmitting(true)
      await timeSlotApi.create({
        ...slotForm,
        date: dayjs(slotForm.date).toISOString(),
        remaining_capacity: slotForm.capacity,
      })
      alert('时段创建成功！')
      setShowCreateSlot(false)
      setSlotForm({
        date: dayjs().format('YYYY-MM-DD'),
        start_time: '09:00',
        end_time: '11:00',
        capacity: 100,
        is_active: true,
        description: '',
      })
      setSlotErrors({})
      loadTimeSlots()
    } catch (error: any) {
      console.error('创建时段失败:', error)
      alert(error?.response?.data?.detail || '创建时段失败')
    } finally {
      setSubmitting(false)
    }
  }

  const validateRuleForm = () => {
    const errors: Record<string, string> = {}
    if (!ruleForm.rule_type) errors.rule_type = '请选择规则类型'
    if (!ruleForm.rule_value.trim()) errors.rule_value = '请输入规则值'
    setRuleErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handleCreateRule = async () => {
    if (!selectedSlot) return
    if (!validateRuleForm()) return
    try {
      setSubmitting(true)
      let parsedValue: any
      try {
        parsedValue = JSON.parse(ruleForm.rule_value)
        if (parsedValue === null || typeof parsedValue !== 'object') {
          parsedValue = { value: parsedValue }
        }
      } catch {
        parsedValue = { value: ruleForm.rule_value }
      }
      await timeSlotApi.createCapacityRule(selectedSlot.id, {
        time_slot_id: selectedSlot.id,
        rule_type: ruleForm.rule_type,
        rule_value: parsedValue,
        priority: ruleForm.priority,
        is_active: true,
        description: ruleForm.description,
      })
      alert('容量规则创建成功！')
      setShowCreateRule(false)
      setRuleForm({
        rule_type: 'max_per_group',
        rule_value: '',
        priority: 0,
        description: '',
      })
      setRuleErrors({})
      loadCapacityRules(selectedSlot.id)
    } catch (error: any) {
      console.error('创建容量规则失败:', error)
      alert(error?.response?.data?.detail || '创建容量规则失败')
    } finally {
      setSubmitting(false)
    }
  }

  const handleDeleteRule = async (ruleId: number) => {
    if (!confirm('确定要删除此容量规则吗？')) return
    try {
      await timeSlotApi.deleteCapacityRule(ruleId)
      if (selectedSlot) {
        loadCapacityRules(selectedSlot.id)
      }
    } catch (error) {
      console.error('删除容量规则失败:', error)
      alert('删除失败')
    }
  }

  const handleDeleteSlot = async () => {
    if (!selectedSlot) return
    if (!confirm('确定要删除此时段吗？关联的预约可能会受影响。')) return
    try {
      await timeSlotApi.delete(selectedSlot.id)
      setSelectedSlot(null)
      setCapacityRules([])
      loadTimeSlots()
    } catch (error) {
      console.error('删除时段失败:', error)
      alert('删除失败')
    }
  }

  const handleToggleSlotActive = async () => {
    if (!selectedSlot) return
    try {
      await timeSlotApi.update(selectedSlot.id, {
        is_active: !selectedSlot.is_active,
      })
      if (selectedSlot) {
        setSelectedSlot({ ...selectedSlot, is_active: !selectedSlot.is_active })
      }
      loadTimeSlots()
    } catch (error) {
      console.error('更新时段状态失败:', error)
      alert('操作失败')
    }
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
        <button
          onClick={() => setShowCreateSlot(true)}
          className="flex items-center px-4 py-2 bg-primary-500 text-white rounded-lg text-sm font-medium hover:bg-primary-600"
        >
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
                    onClick={() => daySlots.length > 0 && handleSelectSlot(daySlots[0])}
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
            <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900 flex items-center">
                <Clock className="mr-2 text-primary-500" size={20} />
                时段详情
              </h2>
              {selectedSlot && (
                <div className="flex items-center gap-1">
                  <button
                    onClick={handleToggleSlotActive}
                    className="p-1.5 text-gray-400 hover:text-primary-600 hover:bg-primary-50 rounded"
                    title={selectedSlot.is_active ? '停用' : '启用'}
                  >
                    <Edit size={16} />
                  </button>
                  <button
                    onClick={handleDeleteSlot}
                    className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded"
                    title="删除"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              )}
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
                        'px-2 py-0.5 text-xs rounded-full cursor-pointer',
                        selectedSlot.is_active
                          ? 'bg-green-100 text-green-700'
                          : 'bg-gray-100 text-gray-600'
                      )}
                      onClick={handleToggleSlotActive}
                    >
                      {selectedSlot.is_active ? '启用中' : '已停用'}
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
              {selectedSlot && (
                <button
                  onClick={() => setShowCreateRule(true)}
                  className="text-sm text-primary-600 hover:text-primary-700 font-medium"
                >
                  + 添加
                </button>
              )}
            </div>
            <div className="p-4">
              {!selectedSlot ? (
                <div className="text-center py-6 text-gray-400">
                  <p className="text-sm">请先选择时段</p>
                </div>
              ) : capacityRules.length === 0 ? (
                <div className="text-center py-6 text-gray-400">
                  <p className="text-sm">暂无容量规则</p>
                  <button
                    onClick={() => setShowCreateRule(true)}
                    className="mt-2 text-xs text-primary-600 hover:underline"
                  >
                    立即添加
                  </button>
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
                          {ruleTypeOptions.find((o) => o.value === rule.rule_type)?.label || rule.rule_type}
                        </span>
                        <div className="flex items-center gap-1">
                          <span className="text-xs text-gray-500 mr-2">
                            优先级 {rule.priority}
                          </span>
                          <button
                            onClick={() => handleDeleteRule(rule.id)}
                            className="p-1 text-gray-400 hover:text-red-600"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>
                      <div className="mt-1 text-xs text-gray-600 bg-white px-2 py-1 rounded">
                        {JSON.stringify(rule.rule_value)}
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

      {/* 新增时段弹窗 */}
      {showCreateSlot && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl w-full max-w-md">
            <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">新增时段</h3>
              <button
                onClick={() => {
                  setShowCreateSlot(false)
                  setSlotErrors({})
                }}
                className="p-1 text-gray-400 hover:text-gray-600"
              >
                <XCircle size={20} />
              </button>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  日期 <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  value={slotForm.date}
                  onChange={(e) => setSlotForm({ ...slotForm, date: e.target.value })}
                  className={cn(
                    'w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent',
                    slotErrors.date ? 'border-red-300' : 'border-gray-300'
                  )}
                />
                {slotErrors.date && (
                  <p className="mt-1 text-xs text-red-500">{slotErrors.date}</p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    开始时间 <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="time"
                    value={slotForm.start_time}
                    onChange={(e) => setSlotForm({ ...slotForm, start_time: e.target.value })}
                    className={cn(
                      'w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent',
                      slotErrors.start_time ? 'border-red-300' : 'border-gray-300'
                    )}
                  />
                  {slotErrors.start_time && (
                    <p className="mt-1 text-xs text-red-500">{slotErrors.start_time}</p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    结束时间 <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="time"
                    value={slotForm.end_time}
                    onChange={(e) => setSlotForm({ ...slotForm, end_time: e.target.value })}
                    className={cn(
                      'w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent',
                      slotErrors.end_time ? 'border-red-300' : 'border-gray-300'
                    )}
                  />
                  {slotErrors.end_time && (
                    <p className="mt-1 text-xs text-red-500">{slotErrors.end_time}</p>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  容量 <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  min={1}
                  value={slotForm.capacity}
                  onChange={(e) =>
                    setSlotForm({ ...slotForm, capacity: Math.max(1, Number(e.target.value)) })
                  }
                  className={cn(
                    'w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent',
                    slotErrors.capacity ? 'border-red-300' : 'border-gray-300'
                  )}
                />
                {slotErrors.capacity && (
                  <p className="mt-1 text-xs text-red-500">{slotErrors.capacity}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  描述
                </label>
                <textarea
                  value={slotForm.description}
                  onChange={(e) => setSlotForm({ ...slotForm, description: e.target.value })}
                  rows={2}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none"
                  placeholder="选填，时段说明"
                />
              </div>

              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={slotForm.is_active}
                  onChange={(e) => setSlotForm({ ...slotForm, is_active: e.target.checked })}
                  className="mr-2"
                />
                <span className="text-sm text-gray-700">立即可用</span>
              </label>
            </div>
            <div className="px-5 py-4 border-t border-gray-100 flex justify-end gap-2">
              <button
                onClick={() => {
                  setShowCreateSlot(false)
                  setSlotErrors({})
                }}
                className="px-4 py-2 text-gray-600 hover:text-gray-800"
              >
                取消
              </button>
              <button
                onClick={handleCreateSlot}
                disabled={submitting}
                className="px-4 py-2 bg-primary-500 text-white rounded-lg font-medium hover:bg-primary-600 disabled:opacity-50"
              >
                {submitting ? '提交中...' : '确认提交'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 新增容量规则弹窗 */}
      {showCreateRule && selectedSlot && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl w-full max-w-md">
            <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">新增容量规则</h3>
              <button
                onClick={() => {
                  setShowCreateRule(false)
                  setRuleErrors({})
                }}
                className="p-1 text-gray-400 hover:text-gray-600"
              >
                <XCircle size={20} />
              </button>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  时段
                </label>
                <p className="text-sm text-gray-600 bg-gray-50 px-3 py-2 rounded-lg">
                  {formatDate(selectedSlot.date)} {selectedSlot.start_time}-{selectedSlot.end_time}
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  规则类型 <span className="text-red-500">*</span>
                </label>
                <select
                  value={ruleForm.rule_type}
                  onChange={(e) => setRuleForm({ ...ruleForm, rule_type: e.target.value })}
                  className={cn(
                    'w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent',
                    ruleErrors.rule_type ? 'border-red-300' : 'border-gray-300'
                  )}
                >
                  {ruleTypeOptions.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
                {ruleErrors.rule_type && (
                  <p className="mt-1 text-xs text-red-500">{ruleErrors.rule_type}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  规则值 <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={ruleForm.rule_value}
                  onChange={(e) => setRuleForm({ ...ruleForm, rule_value: e.target.value })}
                  className={cn(
                    'w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent',
                    ruleErrors.rule_value ? 'border-red-300' : 'border-gray-300'
                  )}
                  placeholder="数字或JSON，如: 10 或 {\"min\": 1, \"max\": 50}"
                />
                {ruleErrors.rule_value && (
                  <p className="mt-1 text-xs text-red-500">{ruleErrors.rule_value}</p>
                )}
                <p className="mt-1 text-xs text-gray-400">
                  简单值直接输入数字/文本，复杂值使用 JSON 格式
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  优先级
                </label>
                <input
                  type="number"
                  value={ruleForm.priority}
                  onChange={(e) =>
                    setRuleForm({ ...ruleForm, priority: Number(e.target.value) })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
                <p className="mt-1 text-xs text-gray-400">数字越大优先级越高，默认为0</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  描述
                </label>
                <input
                  type="text"
                  value={ruleForm.description}
                  onChange={(e) => setRuleForm({ ...ruleForm, description: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  placeholder="规则说明（选填）"
                />
              </div>
            </div>
            <div className="px-5 py-4 border-t border-gray-100 flex justify-end gap-2">
              <button
                onClick={() => {
                  setShowCreateRule(false)
                  setRuleErrors({})
                }}
                className="px-4 py-2 text-gray-600 hover:text-gray-800"
              >
                取消
              </button>
              <button
                onClick={handleCreateRule}
                disabled={submitting}
                className="px-4 py-2 bg-primary-500 text-white rounded-lg font-medium hover:bg-primary-600 disabled:opacity-50"
              >
                {submitting ? '提交中...' : '确认提交'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
